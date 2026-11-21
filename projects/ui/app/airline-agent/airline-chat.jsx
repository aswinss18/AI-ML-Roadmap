"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, MessageSquare, RefreshCw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNotice, Markdown, ModelSelect, ResponseStatus } from "@/components/studio-ui";
import { airlineRequest, requestError } from "./api";

const EXAMPLES = [
  "Is American Airlines flight AA1 on time today?",
  "Show today's departures from Paris to any destination.",
];

export default function AirlineChat() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelError, setModelError] = useState("");
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const modelRequest = useRef(null);
  const chatRequest = useRef(null);
  const composer = useRef(null);

  const loadModels = useCallback(async () => {
    modelRequest.current?.abort();
    const controller = new AbortController();
    modelRequest.current = controller;
    setLoadingModels(true);
    setModelError("");
    try {
      const response = await airlineRequest("/models", {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
      });
      const data = await response.json();
      if (controller.signal.aborted) return;
      const available = [...new Set(data.models.filter((item) => typeof item === "string" && item.trim()))];
      const preferred = available.find((item) => item.startsWith("llama3.2:")) || available[0] || "";
      setModels(available);
      setModel((current) => available.includes(current) ? current : preferred);
      if (!available.length) setModelError("Install a tool-capable model in Ollama, then refresh.");
    } catch (error) {
      if (!controller.signal.aborted) {
        setModelError(requestError(error));
        setModels([]);
        setModel("");
      }
    } finally {
      if (!controller.signal.aborted) setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    const start = setTimeout(loadModels, 0);
    return () => {
      clearTimeout(start);
      modelRequest.current?.abort();
      chatRequest.current?.abort();
    };
  }, [loadModels]);

  async function send(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !model || loadingModels || chatRequest.current) return;

    const history = turns.filter((turn) => turn.complete).slice(-6).flatMap((turn) => [
      { role: "user", content: turn.message },
      { role: "assistant", content: turn.reply.slice(0, 8000) },
    ]);
    const id = crypto.randomUUID();
    const controller = new AbortController();
    chatRequest.current = controller;
    setTurns((current) => [...current, { id, message, reply: "" }]);
    setDraft("");
    setSending(true);
    setError("");
    let reply = "";

    function updateTurn(fields) {
      setTurns((current) => current.map((turn) => turn.id === id ? { ...turn, ...fields } : turn));
    }

    try {
      const response = await airlineRequest("/chat-airline-agent", {
        body: { model, message, history },
        signal: controller.signal,
        accept: "text/plain",
      });
      if (!response.body) throw new Error("Lisa returned an empty reply.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done } = await reader.read();
          reply += decoder.decode(value, { stream: !done });
          updateTurn({ reply });
          if (done) break;
        }
      } finally {
        reader.releaseLock();
      }
      if (!reply.trim()) throw new Error("Lisa returned an empty reply.");
      updateTurn({ complete: true });
    } catch (error) {
      if (controller.signal.aborted) {
        updateTurn({ note: "Reply stopped" });
      } else {
        updateTurn({ note: "Reply incomplete" });
        setError(requestError(error));
        setDraft((current) => current || message);
      }
    } finally {
      chatRequest.current = null;
      setSending(false);
    }
  }

  return (
    <section className="airline-surface airline-chat" aria-label="Airline assistant chat">
      <div className="airline-chat-header">
        <div>
          <h3>Ask Lisa</h3>
          <p>Ask about a route, flight status, or delays.</p>
        </div>
        <div className="airline-chat-model">
          <ModelSelect id="airline-model" models={models} value={model}
            onValueChange={setModel} loading={loadingModels} disabled={sending} />
          <Button type="button" variant="outline" size="icon" disabled={sending || loadingModels}
            onClick={loadModels} aria-label="Refresh models" title="Refresh models">
            <RefreshCw aria-hidden="true" />
          </Button>
        </div>
      </div>

      {modelError && <ErrorNotice title="Models unavailable">{modelError}</ErrorNotice>}
      {turns.length ? (
        <div className="airline-transcript" aria-label="Conversation">
          {turns.map(({ id, message, reply, note }) => (
            <div key={id} className="airline-turn">
              <p className="airline-user-message">{message}</p>
              {(reply || note) && (
                <div className="airline-reply">
                  <strong>Lisa</strong>
                  {reply && <Markdown>{reply}</Markdown>}
                  {note && <small>{note}</small>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="airline-chat-starters">
          {EXAMPLES.map((example) => (
            <Button key={example} type="button" variant="outline" className="airline-prompt"
              onClick={() => {
                setDraft(example);
                composer.current?.focus();
              }}>
              <MessageSquare aria-hidden="true" />{example}
            </Button>
          ))}
        </div>
      )}

      {error && <ErrorNotice title="Could not finish the reply">{error}</ErrorNotice>}
      {sending && <ResponseStatus active>Lisa is responding…</ResponseStatus>}
      <form className="airline-composer" onSubmit={send}>
        <Label htmlFor="airline-message" className="sr-only">Message Lisa</Label>
        <Textarea id="airline-message" ref={composer} value={draft} maxLength={8000}
          onChange={(event) => setDraft(event.target.value)} placeholder="Ask about a flight…" />
        {sending ? (
          <Button type="button" variant="outline" onClick={() => chatRequest.current?.abort()}>
            <Square aria-hidden="true" /> Stop
          </Button>
        ) : (
          <Button type="submit" disabled={!draft.trim() || !model || loadingModels}>
            <ArrowUp aria-hidden="true" /> Send
          </Button>
        )}
      </form>
    </section>
  );
}
