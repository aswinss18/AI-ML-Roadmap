"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  AudioLines,
  BookOpen,
  Check,
  Compass,
  Copy,
  Lightbulb,
  PenLine,
  RefreshCw,
  Square,
} from "lucide-react";
import { BotAvatar } from "@/components/bot-avatar";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ErrorNotice,
  Markdown,
  ModelBadge,
  ModelSelect,
  Thinking,
} from "@/components/studio-ui";
import "./genie.css";

const API_URL = (
  process.env.NEXT_PUBLIC_GENIE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const SUGGESTIONS = [
  {
    title: "Explain a concept",
    label: "Break down something complex",
    icon: BookOpen,
    prompt:
      "Explain how large language models work using a simple everyday analogy.",
  },
  {
    title: "Draft something",
    label: "Find the right words",
    icon: PenLine,
    prompt:
      "Help me write a friendly, professional email. Ask me who it is for and what I want to say.",
  },
  {
    title: "Explore an idea",
    label: "Think through the possibilities",
    icon: Lightbulb,
    prompt:
      "Help me brainstorm a small AI project I could build this weekend. Ask about my interests first.",
  },
  {
    title: "Make a plan",
    label: "Turn a goal into next steps",
    icon: Compass,
    prompt:
      "Help me break a big goal into small, achievable steps. Ask me what I want to accomplish.",
  },
];

export default function GeniePage() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelError, setModelError] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const requestRef = useRef(null);
  const modelsRequestRef = useRef(null);
  const inputRef = useRef(null);
  const transcriptRef = useRef(null);
  const followRef = useRef(true);

  const loadModels = useCallback(async (showSuccess = false) => {
    modelsRequestRef.current?.abort();
    const controller = new AbortController();
    modelsRequestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_URL}/models`, {
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          "Could not load models. Check that Genie and Ollama are running, then retry.",
        );
      const data = await response.json();
      if (modelsRequestRef.current !== controller || controller.signal.aborted)
        return;
      setModelError("");
      const available = Array.isArray(data.models)
        ? [
            ...new Set(
              data.models.filter(
                (item) => typeof item === "string" && item.trim(),
              ),
            ),
          ]
        : [];
      setModels(available);
      setModel((current) =>
        available.includes(current) ? current : available[0] || "",
      );
      if (!available.length) {
        setModelError(
          "No models found. Install a model in Ollama, then refresh the list.",
        );
        notify("No models found.", "warning");
      } else if (showSuccess) {
        notify("Model list refreshed.", "success");
      }
    } catch (err) {
      if (modelsRequestRef.current !== controller) return;
      notify("Could not load assistant models.", "error");
      setModels([]);
      setModel("");
      setModelError(
        err.name === "AbortError"
          ? "Loading models timed out. Check the API and try again."
          : err instanceof TypeError
            ? "Cannot reach Genie. Start the assistant API, then retry."
            : err.message,
      );
    } finally {
      clearTimeout(timeout);
      if (modelsRequestRef.current === controller) setLoadingModels(false);
    }
  }, []);

  function refreshModels() {
    setLoadingModels(true);
    setModelError("");
    loadModels(true);
  }

  useEffect(() => {
    // Defer startup so React's setup/cleanup probe can cancel an unused fetch.
    const startup = setTimeout(loadModels, 0);
    return () => {
      clearTimeout(startup);
      const controller = modelsRequestRef.current;
      modelsRequestRef.current = null;
      controller?.abort();
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [loadModels]);

  useEffect(() => {
    if (messages.length && followRef.current && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  async function sendMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !model || requestRef.current || loadingModels) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const id = crypto.randomUUID();
    followRef.current = true;
    setMessages((current) => [
      ...current,
      { id: `${id}-user`, role: "user", content: message },
      { id, role: "assistant", content: "", model },
    ]);
    setDraft("");
    setError("");
    setStatus("Genie is thinking…");
    setStreaming(true);
    let content = "";
    function updateReply(extra) {
      content += extra;
      setMessages((current) =>
        current.map((item) => (item.id === id ? { ...item, content } : item)),
      );
    }
    try {
      const response = await fetch(`${API_URL}/chat-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message, model }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `Genie could not answer (HTTP ${response.status}). Please try again.`,
        );
      }
      if (!response.body) throw new Error("Genie returned an empty response.");
      // This API sends raw text chunks, despite its text/event-stream header.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done } = await reader.read();
          updateReply(decoder.decode(value, { stream: !done }));
          if (done) break;
          setStatus("Genie is replying…");
        }
      } finally {
        reader.releaseLock();
      }
      if (!content.trim())
        throw new Error("Genie returned an empty answer. Try another model.");
      if (
        content.includes(
          "Error: The assistant response stream was interrupted.",
        )
      ) {
        throw new Error(
          "The reply was interrupted on the server. You can send a follow-up to continue.",
        );
      }
      if (controller.signal.aborted) throw controller.signal.reason;
      setStatus("");
      notify("Reply complete.", "success");
    } catch (err) {
      if (requestRef.current !== controller) return;
      if (controller.signal.aborted) {
        setStatus("");
        setMessages((current) =>
          current.map((item) =>
            item.id === id ? { ...item, note: "Reply stopped" } : item,
          ),
        );
      } else {
        notify("Genie could not finish the reply.", "error");
        setError(
          err instanceof TypeError
            ? "Connection lost. Check that the Genie API is running, then send your message again."
            : err.message,
        );
        setStatus("");
        setMessages((current) =>
          current.map((item) =>
            item.id === id ? { ...item, note: "Reply incomplete" } : item,
          ),
        );
        setDraft((current) => current || message);
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setStreaming(false);
      }
    }
  }

  async function copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      notify("Reply copied to clipboard.", "success");
    } catch {
      notify(
        "Copy is unavailable. Select the reply text to copy it manually.",
        "error",
      );
    }
  }

  return (
    <div className="genie-page">
      <div className="session-toolbar">
        <span>
          <AudioLines size={16} />
          Conversation
        </span>
      </div>
      <section
        className={`genie-workspace ${messages.length ? "has-conversation" : "is-empty"}`}
        aria-label="Genie assistant"
      >
        {modelError && (
          <div className="genie-model-notice">
            <ErrorNotice
              title="Let's get your models connected"
              action={
                <Button
                  variant="outline"
                  type="button"
                  disabled={loadingModels}
                  onClick={refreshModels}
                >
                  <RefreshCw />
                  Try again
                </Button>
              }
            >
              {modelError}
            </ErrorNotice>
          </div>
        )}
        <div
          className="genie-transcript"
          ref={transcriptRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            followRef.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 100;
          }}
        >
          {!messages.length ? (
            <div className="conversation-intro genie-welcome">
              <BotAvatar name="genie" size={32} className="intro-icon" />
              <span className="intro-caption">YOUR THINKING SPACE</span>
              <h2>What are you working on?</h2>
              <p>
                Start with a question, a rough draft, or a half-formed idea.
              </p>
            </div>
          ) : (
            <div
              className="genie-messages"
              role="log"
              aria-label="Conversation"
              aria-live="polite"
              aria-busy={streaming}
            >
              {messages.map((message, index) => (
                <article
                  key={message.id}
                  className={`genie-message genie-message-${message.role}`}
                  aria-label={
                    message.role === "user" ? "Your message" : "Genie reply"
                  }
                >
                  {message.role === "assistant" ? (
                    <BotAvatar name="genie" size={29} className="genie-message-avatar" />
                  ) : (
                    <span className="genie-message-avatar" aria-hidden="true">Y</span>
                  )}
                  <div className="genie-message-body">
                    <header>
                      <strong>
                        {message.role === "assistant" ? "Genie" : "You"}
                      </strong>
                      {message.model && (
                        <ModelBadge>{message.model}</ModelBadge>
                      )}
                    </header>
                    {message.role === "user" ? (
                      <p className="genie-user-text">{message.content}</p>
                    ) : message.content ? (
                      <Markdown>{message.content}</Markdown>
                    ) : streaming && index === messages.length - 1 ? (
                      <Thinking text="Thinking it through…" />
                    ) : null}
                    {message.note && (
                      <p className="genie-message-note">{message.note}</p>
                    )}
                    {message.role === "assistant" &&
                      message.content &&
                      !(streaming && index === messages.length - 1) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="genie-copy"
                          onClick={() => copyMessage(message)}
                        >
                          {copiedId === message.id ? <Check /> : <Copy />}
                          {copiedId === message.id ? "Copied" : "Copy reply"}
                        </Button>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="genie-compose-area">
          <ErrorNotice title="Message couldn't finish">{error}</ErrorNotice>
          <Card className="genie-composer">
            <form onSubmit={sendMessage}>
              <Label htmlFor="genie-message" className="sr-only">
                Message Genie
              </Label>
              <Textarea
                ref={inputRef}
                id="genie-message"
                value={draft}
                rows={2}
                placeholder="Message Genie…"
                maxLength={20000}
                aria-describedby="genie-input-hint"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form.requestSubmit();
                  }
                }}
              />
              <div className="genie-composer-footer">
                <div className="genie-model-tools">
                  <ModelSelect
                    id="genie-model"
                    label="AI model"
                    value={model}
                    onValueChange={setModel}
                    models={models}
                    loading={loadingModels}
                    disabled={streaming}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Refresh models"
                        disabled={loadingModels || streaming}
                        onClick={refreshModels}
                      >
                        <RefreshCw
                          className={loadingModels ? "animate-spin" : ""}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh models</TooltipContent>
                  </Tooltip>
                </div>
                {streaming ? (
                  <Button
                    type="button"
                    className="genie-send"
                    onClick={(event) => {
                      event.preventDefault();
                      requestRef.current?.abort();
                      notify("Reply stopped.");
                    }}
                  >
                    <Square className="size-3" />
                    Stop response
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="genie-send"
                    disabled={!draft.trim() || !model || loadingModels}
                  >
                    Send message
                    <ArrowUp size={14} />
                  </Button>
                )}
              </div>
            </form>
          </Card>
          {!messages.length && (
            <div className="starter-list genie-starters">
              <span>Start with</span>
              {SUGGESTIONS.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  onClick={() => {
                    setDraft(item.prompt);
                    inputRef.current?.focus();
                  }}
                >
                  <item.icon size={15} />
                  <span>{item.title}</span>
                </Button>
              ))}
            </div>
          )}
          <div className="genie-bottom-note">
            <span id="genie-input-hint">
              <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line
            </span>
            <span>AI can make mistakes. Check what matters.</span>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {status}
          </p>
        </div>
      </section>
    </div>
  );
}
