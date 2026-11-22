"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, CalendarDays, Check, Clock3, Copy, Loader2, PlaneTakeoff, Plus, Radar, RefreshCw, Square, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNotice, Markdown, ModelSelect, ResponseStatus, ThinkToggle } from "@/components/studio-ui";
import { airlineRequest, CHAT_EVENT_FORMAT, readChatEvents, requestError } from "./api";

const EXAMPLES = [
  { title: "Find departures", icon: PlaneTakeoff, prompt: "Show today's departures from Trivandrum." },
  { title: "Track a flight", icon: Radar, prompt: "Is American Airlines flight AA1 on time today?" },
  { title: "Check yesterday’s flights", icon: CalendarDays, prompt: "What flights left Paris for New York yesterday?" },
];

const TOOLS = {
  get_datetime: { active: "Resolving local dates", complete: "Local date", icon: Clock3 },
  search_flights: { active: "Searching Aviationstack", complete: "Flight search", icon: PlaneTakeoff },
  get_flight_status: { active: "Checking flight status", complete: "Flight status", icon: Radar },
};

function ToolActivity({ steps, active }) {
  if (!steps.length) return null;
  return (
    <ul className="airline-tool-list" aria-label="Tool activity">
      {steps.map((step) => {
        const tool = TOOLS[step.tool];
        const running = !step.detail && active;
        const Icon = running ? Loader2 : step.failed ? TriangleAlert : step.detail ? Check : tool.icon;
        return (
          <li key={step.id} data-running={running || undefined} data-failed={step.failed || undefined}>
            <Icon aria-hidden="true" />
            <span>{running ? tool.active : tool.complete}</span>
            {step.detail ? <small>{step.detail}</small> : !running && <small>Stopped</small>}
          </li>
        );
      })}
    </ul>
  );
}

export default function AirlineChat() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [think, setThink] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelError, setModelError] = useState("");
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState([]);
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const modelRequest = useRef(null);
  const chatRequest = useRef(null);
  const composer = useRef(null);
  const transcript = useRef(null);
  const follow = useRef(true);
  const runningTool = sending && turns.at(-1)?.steps.find((step) => !step.detail);

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
      const available = [...new Set((data.models || []).filter((item) => typeof item === "string" && item.trim()))];
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

  useEffect(() => {
    if (follow.current && transcript.current) {
      transcript.current.scrollTop = transcript.current.scrollHeight;
    }
  }, [turns, phase]);

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
    follow.current = true;
    setTurns((current) => [...current, { id, message, reply: "", steps: [] }]);
    setDraft("");
    setSending(true);
    setPhase("Connecting to Lisa…");
    setError("");
    let reply = "";
    let done = false;

    function updateTurn(update) {
      setTurns((current) => current.map((turn) => turn.id === id ? { ...turn, ...update(turn) } : turn));
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      const response = await airlineRequest("/chat-airline-agent", {
        body: { model, message, history, timezone, think },
        signal: controller.signal,
        accept: CHAT_EVENT_FORMAT,
      });
      for await (const event of readChatEvents(response)) {
        switch (event.type) {
          case "thinking":
            setPhase("Lisa is reviewing your question…");
            break;
          case "tool_start":
            if (TOOLS[event.tool]) {
              updateTurn((turn) => ({ steps: [...turn.steps, { id: event.id, tool: event.tool }] }));
              setPhase("");
            }
            break;
          case "tool_end":
            updateTurn((turn) => ({
              steps: turn.steps.map((step) => step.id === event.id
                ? { ...step, detail: event.detail, failed: event.failed }
                : step),
            }));
            break;
          case "writing":
            setPhase("Lisa is writing a reply…");
            break;
          case "delta": {
            reply += event.text;
            const content = reply;
            updateTurn(() => ({ reply: content }));
            setPhase("");
            break;
          }
          case "done":
            done = true;
            break;
          case "error":
            throw new Error(event.message);
        }
      }
      if (!done || !reply.trim()) throw new Error("The reply stream ended early. Try sending your message again.");
      updateTurn(() => ({ complete: true }));
    } catch (error) {
      if (controller.signal.aborted) {
        updateTurn(() => ({ note: "Reply stopped" }));
      } else {
        updateTurn(() => ({ note: "Reply incomplete" }));
        setError(requestError(error));
        setDraft((current) => current || message);
      }
    } finally {
      chatRequest.current = null;
      setSending(false);
      setPhase("");
    }
  }

  async function copyReply(turn) {
    try {
      await navigator.clipboard.writeText(turn.reply);
      setCopied(turn.id);
    } catch {
      setError("Could not copy the reply. Select the text to copy it manually.");
    }
  }

  return (
    <section className={`airline-chat ${turns.length ? "has-turns" : "is-empty"}`} aria-label="Ask Lisa">
      {turns.length > 0 && (
        <div className="airline-chat-bar">
          <Button variant="ghost" size="sm" disabled={sending} onClick={() => {
            setTurns([]);
            setDraft("");
            setCopied(null);
            setError("");
            composer.current?.focus();
          }}>
            <Plus aria-hidden="true" /> New chat
          </Button>
        </div>
      )}

      <div className="airline-transcript" ref={transcript} onScroll={({ currentTarget }) => {
        follow.current = currentTarget.scrollHeight - currentTarget.scrollTop - currentTarget.clientHeight < 100;
      }}>
        {turns.length ? (
          <div className="airline-messages" role="log" aria-label="Conversation" aria-live="polite" aria-busy={sending}>
            {turns.map((turn, index) => {
              const active = sending && index === turns.length - 1;
              return (
                <div key={turn.id} className="airline-turn">
                  <p className="airline-user-message" aria-label="Your message">{turn.message}</p>
                  <article className="airline-answer" aria-label="Lisa reply">
                    <Image className="airline-avatar" src="/brand/lisa-avatar.webp"
                      alt="" width={30} height={30} unoptimized />
                    <div className="airline-reply">
                      <strong>Lisa</strong>
                      <ToolActivity steps={turn.steps} active={active} />
                      {turn.reply && <Markdown>{turn.reply}</Markdown>}
                      {turn.note && <p className="airline-turn-note">{turn.note}</p>}
                      {turn.reply && !active && (
                        <Button type="button" variant="ghost" size="sm" className="airline-copy" onClick={() => copyReply(turn)}>
                          {copied === turn.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                          {copied === turn.id ? "Copied" : "Copy reply"}
                        </Button>
                      )}
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="airline-welcome">
            <Image className="airline-welcome-avatar" src="/brand/lisa-avatar.webp"
              alt="" width={54} height={54} unoptimized />
            <h2>How can Lisa help?</h2>
            <p>Check departures, track a flight, or look up a recent route.</p>
          </div>
        )}
      </div>

      <div className="airline-compose-area">
        <ErrorNotice title="Models unavailable">{modelError}</ErrorNotice>
        <ErrorNotice title="Chat needs attention">{error}</ErrorNotice>
        <div className="airline-live-status" aria-live="polite">
          {sending && phase && <ResponseStatus active>{phase}</ResponseStatus>}
          {runningTool && <span className="sr-only">{TOOLS[runningTool.tool].active}</span>}
        </div>
        <form className="airline-composer" onSubmit={send}>
          <Label htmlFor="airline-message" className="sr-only">Message Lisa</Label>
          <Textarea id="airline-message" ref={composer} value={draft} maxLength={8000} rows={2}
            onChange={(event) => setDraft(event.target.value)} placeholder="Message Lisa…"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.currentTarget.form.requestSubmit();
              }
            }} />
          <div className="airline-composer-controls">
            <div className="airline-chat-model">
              <ModelSelect id="airline-model" models={models} value={model}
                onValueChange={setModel} loading={loadingModels} disabled={sending} />
              <Button type="button" variant="ghost" size="icon" disabled={sending || loadingModels}
                onClick={loadModels} aria-label="Refresh models" title="Refresh models">
                <RefreshCw aria-hidden="true" />
              </Button>
            </div>
            <ThinkToggle think={think} onChange={setThink} disabled={sending} />
            {sending ? (
              <Button type="button" variant="outline" onClick={() => chatRequest.current?.abort()}>
                <Square aria-hidden="true" /> Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!draft.trim() || !model || loadingModels}>
                <ArrowUp aria-hidden="true" /> Send
              </Button>
            )}
          </div>
        </form>
        {!turns.length && (
          <div className="airline-chat-starters" aria-label="Suggested questions">
            {EXAMPLES.map(({ title, icon: Icon, prompt }) => (
              <Button key={title} type="button" variant="outline" size="sm" onClick={() => {
                setDraft(prompt);
                composer.current?.focus();
              }}>
                <Icon aria-hidden="true" />{title}
              </Button>
            ))}
          </div>
        )}
        <p className="airline-chat-source">Recent flight records from Aviationstack</p>
      </div>
    </section>
  );
}
