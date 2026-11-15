"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Layers2,
  MessageCircle,
  RefreshCw,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ErrorNotice,
  Markdown,
  ModelBadge,
  ModelSelect,
  ResponseStatus,
  StepLabel,
  Thinking,
} from "@/components/studio-ui";

const API_URL = (
  process.env.NEXT_PUBLIC_MULTI_CHAT_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const SPEAKERS = { liz: "Liz", jarviz: "Jarviz" };
const DEFAULT_MODEL = "llama3.2:latest";

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
        if (request.signal.aborted) return;
        const defaultModel = models.includes(DEFAULT_MODEL)
          ? DEFAULT_MODEL
          : (models[0] ?? "");
        setModels(models);
        setSelection({ liz: defaultModel, jarviz: defaultModel });
        setModelStatus(models.length ? "ready" : "empty");
      } catch {
        if (!request.signal.aborted || request.signal.reason === "timeout")
          setModelStatus("error");
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

  useEffect(() => () => activeRequest.current?.abort(), []);
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

    try {
      const response = await fetch(`${API_URL}/mutimodel-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: cleanTopic,
          liz_model: selection.liz,
          jarviz_model: selection.jarviz,
        }),
        signal: request.signal,
      });
      if (!response.ok || !response.body)
        throw new Error("The API could not start the conversation.");

      for await (const event of readEvents(response.body)) {
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "done") {
          setStatus("complete");
          return;
        }
        if (event.type === "delta") {
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
      if (request.signal.aborted) {
        setStatus("stopped");
      } else {
        setStatus("failed");
        setError(
          error instanceof TypeError
            ? "Could not reach the chat API. Check that the multi-chat-bots server is running."
            : error.message,
        );
      }
    } finally {
      activeRequest.current = null;
    }
  }

  const modelError = {
    error:
      "Could not load models. Check that the chat API and Ollama are running.",
    empty: "No models found. Install an Ollama model, then refresh the list.",
  }[modelStatus];

  return (
    <div className="multi-workspace">
      <Card className="config-card multi-config">
        <CardHeader>
          <StepLabel number="01">Set the conversation</StepLabel>
          <CardTitle>Configure a conversation</CardTitle>
          <CardDescription>
            Choose a topic and a model for each participant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="studio-form" onSubmit={startConversation}>
            <div className="field-group">
              <Label htmlFor="chat-topic">What&apos;s on the table?</Label>
              <Textarea
                ref={topicRef}
                id="chat-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="How would you design a city on Mars?"
                maxLength={1000}
                required
                disabled={isStreaming}
                aria-describedby="topic-hint"
              />
              <p id="topic-hint" className="field-hint">
                An open question makes a great conversation.
              </p>
              <div className="multi-topic-ideas">
                {[
                  "A city on Mars",
                  "The future of learning",
                  "Can AI be creative?",
                ].map((idea) => (
                  <Button
                    key={idea}
                    type="button"
                    variant="outline"
                    disabled={isStreaming}
                    onClick={() => {
                      setTopic(idea);
                      topicRef.current?.focus();
                    }}
                  >
                    {idea}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <span className="participant-label">PARTICIPANTS</span>
              <div className="participant-list">
                {Object.entries(SPEAKERS).map(([speaker, name]) => (
                  <div className="participant" key={speaker}>
                    <span className={`participant-avatar ${speaker}`}>
                      {name[0]}
                    </span>
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
            </div>
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
            <Button
              className="primary-action w-full"
              type={isStreaming ? "button" : "submit"}
              variant={isStreaming ? "outline" : "default"}
              onClick={
                isStreaming ? () => activeRequest.current?.abort() : undefined
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
                  <MessageCircle />
                  Start conversation
                  <ArrowRight className="ml-auto" />
                </>
              )}
            </Button>
            <p className="form-footnote">
              {modelStatus === "loading"
                ? "Finding your available models…"
                : "Models take turns responding to the shared topic."}
            </p>
          </form>
        </CardContent>
      </Card>
      <Card className="conversation-panel">
        <div className="preview-toolbar">
          <span>
            <MessageCircle size={14} />
            The conversation
          </span>
          {run ? (
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
          ) : (
            <Badge variant="outline">READY WHEN YOU ARE</Badge>
          )}
        </div>
        {run ? (
          <>
            <div className="conversation-subject">
              <span>ON THE TABLE</span>
              <h3>{run.topic}</h3>
            </div>
            <div
              className="conversation-turns"
              role="log"
              aria-label="Conversation turns"
              aria-live="polite"
              aria-busy={isStreaming}
              ref={transcriptRef}
              onScroll={(event) => {
                const el = event.currentTarget;
                followRef.current =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 100;
              }}
            >
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
                  <span className={`participant-avatar ${speaker}`}>
                    {SPEAKERS[speaker]?.[0]}
                  </span>
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
            </div>
            {error && (
              <div className="p-5 pt-0">
                <ErrorNotice title="Conversation interrupted">
                  {error}
                </ErrorNotice>
              </div>
            )}
          </>
        ) : (
          <div className="conversation-empty">
            <div className="conversation-duet" aria-hidden="true">
              <span className="participant-avatar">L</span>
              <ArrowLeftRight size={25} strokeWidth={1} />
              <span className="participant-avatar jarviz">J</span>
            </div>
            <h3>A conversation between models.</h3>
            <p>
              Choose a topic and let two AI models explore it together. Their
              responses will appear here.
            </p>
            <Badge variant="outline">
              <Layers2 size={12} />
              Liz + Jarviz
            </Badge>
          </div>
        )}
        <div className="preview-bottom">
          <Layers2 size={13} />
          <span>Liz + Jarviz</span>
          <span className="ml-auto">
            {run ? `${messages.length} turns` : "Waiting to begin"}
          </span>
        </div>
      </Card>
    </div>
  );
}
