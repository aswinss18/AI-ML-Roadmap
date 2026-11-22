"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Layers2,
  MessageCircle,
  RefreshCw,
  Square,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDefaultModel } from "@/lib/models";
import { notify } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BotAvatar } from "@/components/bot-avatar";
import {
  ErrorNotice,
  Markdown,
  ModelBadge,
  ModelSelect,
  ResponseStatus,
  ThinkToggle,
  Thinking,
} from "@/components/studio-ui";

const TOPICS = [
  "A city on Mars",
  "The future of learning",
  "Can AI be creative?",
];
const API_URL = (
  process.env.NEXT_PUBLIC_MULTI_CHAT_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const SPEAKERS = { liz: "Liz", jarviz: "Jarviz" };

async function* readEvents(body) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = (buffer + value).split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) yield JSON.parse(line);
      }
    }
    if (buffer.trim()) yield JSON.parse(buffer);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export default function Conversation() {
  const [topic, setTopic] = useState("");
  const [think, setThink] = useState(false);
  const [models, setModels] = useState([]);
  const [selection, setSelection] = useState({ liz: "", jarviz: "" });
  const [modelStatus, setModelStatus] = useState("loading");
  const [modelRequest, setModelRequest] = useState(0);
  const [run, setRun] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const activeRequest = useRef(null);
  const topicRef = useRef(null);
  const transcriptRef = useRef(null);
  const followRef = useRef(true);
  const isStreaming = status === "streaming";

  useEffect(() => {
    const request = new AbortController();
    const timeout = setTimeout(() => request.abort("timeout"), 15000);

    async function loadModels() {
      try {
        const response = await fetch(`${API_URL}/models`, {
          signal: request.signal,
        });
        if (!response.ok) throw new Error("Could not load models.");
        const data = await response.json();
        const models = Array.isArray(data.models)
          ? [
              ...new Set(
                data.models.filter(
                  (item) => typeof item === "string" && item.trim(),
                ),
              ),
            ]
          : [];
        if (request.signal.aborted) throw request.signal.reason;
        const defaultModel = getDefaultModel(models);
        setModels(models);
        setSelection((current) => ({
          liz: models.includes(current.liz) ? current.liz : defaultModel,
          jarviz: models.includes(current.jarviz) ? current.jarviz : defaultModel,
        }));
        setModelStatus(models.length ? "ready" : "empty");
        if (!models.length) {
          notify("No chat models found.", "warning");
        } else if (modelRequest > 0) {
          notify("Chat models loaded.", "success");
        }
      } catch {
        if (!request.signal.aborted || request.signal.reason === "timeout") {
          setModelStatus("error");
          notify("Could not load chat models.", "error");
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    loadModels();
    return () => {
      clearTimeout(timeout);
      request.abort();
    };
  }, [modelRequest]);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    },
    [],
  );
  useEffect(() => {
    if (followRef.current && transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages]);

  async function startConversation(event) {
    event.preventDefault();
    const cleanTopic = topic.trim();
    if (
      !cleanTopic ||
      !selection.liz ||
      !selection.jarviz ||
      activeRequest.current
    )
      return;

    const request = new AbortController();
    activeRequest.current = request;
    followRef.current = true;
    setRun({ topic: cleanTopic, models: selection });
    setMessages([]);
    setError("");
    setStatus("streaming");
    let hasReply = false;

    try {
      const response = await fetch(`${API_URL}/mutimodel-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: cleanTopic,
          liz_model: selection.liz,
          jarviz_model: selection.jarviz,
          think,
        }),
        signal: request.signal,
      });
      if (!response.ok || !response.body)
        throw new Error("The API could not start the conversation.");

      for await (const event of readEvents(response.body)) {
        if (request.signal.aborted) return;
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "done") {
          if (!hasReply)
            throw new Error(
              "No replies arrived. Try starting the conversation again.",
            );
          setStatus("complete");
          notify("Conversation complete.", "success");
          return;
        }
        if (event.type === "delta") {
          hasReply ||= Boolean(event.text?.trim());
          setMessages((current) => {
            const last = current.at(-1);
            const { speaker, turn, text } = event;
            if (last?.turn === turn) {
              return [
                ...current.slice(0, -1),
                { ...last, text: last.text + text },
              ];
            }
            return [...current, { speaker, turn, text }];
          });
        }
      }
      throw new Error(
        "The conversation stream ended early. You can start a new conversation.",
      );
    } catch (error) {
      if (activeRequest.current !== request) return;
      if (request.signal.aborted) {
        setStatus("stopped");
      } else {
        setStatus("failed");
        notify("Conversation interrupted.", "error");
        setError(
          error instanceof TypeError
            ? "Could not reach the chat API. Check that the multi-chat-bots server is running."
            : error.message,
        );
      }
    } finally {
      if (activeRequest.current === request) activeRequest.current = null;
    }
  }

  const sessionLabel =
    {
      streaming: "In progress",
      complete: "Complete",
      stopped: "Stopped",
      failed: "Interrupted",
    }[status] || "Not started";

  const modelError = {
    error:
      "Could not load models. Check that the chat API and Ollama are running.",
    empty: "No models found. Install an Ollama model, then refresh the list.",
  }[modelStatus];

  return (
    <div className="multi-workspace document-workbench">
      <aside className="workbench-inspector" aria-label="Conversation settings">
        <div className="inspector-heading">
          <Layers2 size={16} />
          <h2>Participants</h2>
        </div>
        <div className="inspector-section">
          <div className="participant-list">
            {Object.entries(SPEAKERS).map(([speaker, name], index) => (
              <div className="participant" key={speaker}>
                <div className="participant-heading">
                  <BotAvatar name={speaker} size={25} className="participant-avatar" />
                  <strong>{name}</strong>
                  <span>Participant {index + 1}</span>
                </div>
                <ModelSelect
                  id={`${speaker}-model`}
                  label={`${name}'s model`}
                  value={selection[speaker]}
                  models={models}
                  loading={modelStatus === "loading"}
                  disabled={isStreaming || modelStatus !== "ready"}
                  onValueChange={(model) =>
                    setSelection((current) => ({
                      ...current,
                      [speaker]: model,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <p className="field-hint">
            Choose different models to compare their thinking.
          </p>
          <ErrorNotice
            title="Models aren't ready"
            action={
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setModelStatus("loading");
                  setModelRequest((current) => current + 1);
                }}
              >
                <RefreshCw />
                Refresh models
              </Button>
            }
          >
            {modelError}
          </ErrorNotice>
        </div>
        <div className="inspector-section">
          <div className="section-caption">
            <h3>Session details</h3>
          </div>
          <dl className="session-details">
            <div>
              <dt>Status</dt>
              <dd>{sessionLabel}</dd>
            </div>
            <div>
              <dt>Conversation turns</dt>
              <dd>{messages.length}</dd>
            </div>
            <div>
              <dt>Response order</dt>
              <dd>Alternating</dd>
            </div>
          </dl>
        </div>
        <div className="inspector-footnote">
          <MessageCircle size={17} />
          <p>
            One shared topic.
            <br />
            Two different perspectives.
          </p>
          <span>Each participant builds on the conversation so far.</span>
        </div>
      </aside>
      <section
        className={`conversation-panel ${run ? "has-conversation" : "is-empty"}`}
        aria-label="Model discussion"
      >
        <div className="editor-toolbar">
          <span className="toolbar-title">
            <List size={16} />
            Transcript
          </span>
          {run && (
            <ResponseStatus active={isStreaming}>
              {
                {
                  streaming: "Live conversation",
                  complete: "Complete",
                  stopped: "Stopped",
                  failed: "Interrupted",
                }[status]
              }
            </ResponseStatus>
          )}
        </div>
        {run && (
          <div className="conversation-subject">
            <span>DISCUSSION TOPIC</span>
            <h2>{run.topic}</h2>
          </div>
        )}
        <div
          className="conversation-turns"
          role={run ? "log" : undefined}
          aria-label={run ? "Conversation turns" : undefined}
          aria-live={run ? "polite" : undefined}
          aria-busy={isStreaming}
          ref={transcriptRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            followRef.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 100;
          }}
        >
          {run ? (
            <>
              {!messages.length &&
                (isStreaming ? (
                  <Thinking text="Waiting for Jarviz to get things started…" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No replies yet. Start a new conversation when you&apos;re
                    ready.
                  </p>
                ))}
              {messages.map(({ speaker, turn, text }) => (
                <article
                  key={turn}
                  className={`conversation-turn ${speaker}`}
                  aria-label={`${SPEAKERS[speaker]} turn ${turn}`}
                >
                  <BotAvatar name={speaker} size={29} className="participant-avatar" />
                  <div>
                    <header>
                      <strong>{SPEAKERS[speaker]}</strong>
                      <ModelBadge>{run.models[speaker]}</ModelBadge>
                      <span>TURN {turn}</span>
                    </header>
                    <Markdown>{text}</Markdown>
                  </div>
                </article>
              ))}
            </>
          ) : (
            <div className="discussion-intro">
              <span className="intro-caption">TWO MODELS. ONE QUESTION.</span>
              <h2>See both sides of an idea.</h2>
              <p>
                Give Liz and Jarviz a topic. Follow the thinking as it unfolds.
              </p>
              <div className="discussion-ready">
                <BotAvatar name="liz" size={23} />
                <span>Liz</span>
                <span className="discussion-plus">+</span>
                <BotAvatar name="jarviz" size={23} />
                <span>Jarviz</span>
              </div>
            </div>
          )}
        </div>
        <div className="discussion-compose-area">
          <ErrorNotice title="Conversation interrupted">{error}</ErrorNotice>
          <Card className="question-composer">
            <form onSubmit={startConversation}>
              <Label htmlFor="chat-topic" className="sr-only">
                What&apos;s on the table?
              </Label>
              <Textarea
                className="question-textarea"
                ref={topicRef}
                id="chat-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="What should they talk about?"
                maxLength={1000}
                required
                disabled={isStreaming}
                aria-describedby="topic-hint"
              />
              <div className="discussion-composer-controls">
                <span id="topic-hint">
                  {modelStatus === "loading"
                    ? "Finding models…"
                    : "Models take turns responding"}
                </span>
                <ThinkToggle think={think} onChange={setThink} disabled={isStreaming} />
                <Button
                  className="primary-action"
                  type={isStreaming ? "button" : "submit"}
                  variant={isStreaming ? "outline" : "default"}
                  onClick={
                    isStreaming
                      ? (event) => {
                          event.preventDefault();
                          activeRequest.current?.abort();
                          notify("Conversation stopped.");
                        }
                      : undefined
                  }
                  disabled={
                    !isStreaming && (!topic.trim() || modelStatus !== "ready")
                  }
                >
                  {isStreaming ? (
                    <>
                      <Square />
                      Stop conversation
                    </>
                  ) : (
                    <>
                      Start conversation
                      <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
          {!run && (
            <div className="discussion-topics">
              <span>EXPLORE A STARTING POINT</span>
              {TOPICS.map((idea, index) => (
                <Button
                  key={idea}
                  variant="ghost"
                  onClick={() => {
                    setTopic(idea);
                    topicRef.current?.focus();
                  }}
                >
                  <span className="topic-index">0{index + 1}</span>
                  <span>{idea}</span>
                  <ArrowUpRight size={15} />
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="editor-statusbar">
          <span>
            <span className="small-dot" />
            Liz + Jarviz
          </span>
          <span>
            {run ? `${messages.length} turns` : "Session not started"}
          </span>
        </div>
      </section>
    </div>
  );
}
