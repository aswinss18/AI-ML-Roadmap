"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = process.env.NEXT_PUBLIC_MULTI_CHAT_API_BASE_URL || "http://localhost:8001";
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
  const isStreaming = status === "streaming";

  useEffect(() => {
    const request = new AbortController();

    async function loadModels() {
      try {
        const response = await fetch(`${API_URL}/models`, { signal: request.signal });
        if (!response.ok) throw new Error("Could not load models.");
        const { models } = await response.json();
        if (request.signal.aborted) return;
        const defaultModel = models.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : (models[0] ?? "");
        setModels(models);
        setSelection({ liz: defaultModel, jarviz: defaultModel });
        setModelStatus(models.length ? "ready" : "empty");
      } catch {
        if (!request.signal.aborted) setModelStatus("error");
      }
    }

    loadModels();
    return () => request.abort();
  }, [modelRequest]);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function startConversation(event) {
    event.preventDefault();
    const cleanTopic = topic.trim();
    if (!cleanTopic || !selection.liz || !selection.jarviz || activeRequest.current) return;

    const request = new AbortController();
    activeRequest.current = request;
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
      if (!response.ok || !response.body) throw new Error("The API could not start the conversation.");

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
              return [...current.slice(0, -1), { ...last, text: last.text + text }];
            }
            return [...current, { speaker, turn, text }];
          });
        }
      }
      throw new Error("The conversation stream ended early. You can start a new conversation.");
    } catch (error) {
      if (request.signal.aborted) {
        setStatus("stopped");
      } else {
        setStatus("failed");
        setError(error instanceof TypeError
          ? "Could not reach the chat API. Check that the multi-chat-bots server is running."
          : error.message);
      }
    } finally {
      activeRequest.current = null;
    }
  }

  const modelError = {
    error: "Could not load models. Check that the chat API and Ollama are running.",
    empty: "No models found. Install an Ollama model, then refresh the list.",
  }[modelStatus];

  return (
    <div className="multi-chat">
      <section className="tutor-composer">
        <form onSubmit={startConversation}>
          <label className="tutor-field-label" htmlFor="chat-topic">Conversation topic</label>
          <textarea
            id="chat-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="How would you design a city on Mars?"
            maxLength={1000}
            required
            disabled={isStreaming}
          />
          <div className="multi-chat-models">
            {Object.entries(SPEAKERS).map(([speaker, name]) => (
              <label className="model-select tutor-model-select" key={speaker}>
                <span>{name}&apos;s model</span>
                <select
                  value={selection[speaker]}
                  onChange={(event) => {
                    const model = event.target.value;
                    setSelection((current) => ({ ...current, [speaker]: model }));
                  }}
                  disabled={isStreaming || modelStatus !== "ready"}
                >
                  {!models.length && <option value="">No models available</option>}
                  {models.map((model) => <option key={model}>{model}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="tutor-composer-footer">
            <span className="tutor-privacy-note" role="status">
              {modelStatus === "loading" ? "Loading Ollama models…" : "Powered by Ollama"}
            </span>
            <div className="tutor-form-actions">
              {isStreaming && (
                <button className="tutor-stop-button" type="button" onClick={() => activeRequest.current?.abort()}>
                  Stop
                </button>
              )}
              <button className="tutor-submit-button" type="submit" disabled={!topic.trim() || modelStatus !== "ready" || isStreaming}>
                Start conversation
              </button>
            </div>
          </div>
          {modelError && (
            <div className="tutor-error multi-chat-model-error" role="alert">
              <span>{modelError}</span>
              <button className="tutor-stop-button" type="button" onClick={() => {
                setModelStatus("loading");
                setModelRequest((current) => current + 1);
              }}>Refresh models</button>
            </div>
          )}
        </form>
      </section>

      {run && (
        <section className="multi-chat-transcript" aria-labelledby="chat-transcript-heading">
          <header className="multi-chat-transcript-header">
            <h2 id="chat-transcript-heading">{run.topic}</h2>
            <span className="tutor-stream-status" role="status">
              <span className={isStreaming ? "stream-status-dot is-active" : "stream-status-dot"} />
              {{ streaming: messages.length ? "Streaming" : "Waiting for Jarviz…", complete: "Complete", stopped: "Stopped", failed: "Interrupted" }[status]}
            </span>
          </header>
          <div className="multi-chat-messages">
            {messages.map(({ speaker, turn, text }) => (
              <article className={`multi-chat-message ${speaker}`} key={turn} aria-label={SPEAKERS[speaker]}>
                <header>
                  <strong>{SPEAKERS[speaker]}</strong>
                  <span className="tutor-model-caption">{run.models[speaker]}</span>
                </header>
                <div className="tutor-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
          {error && <p className="tutor-error" role="alert">{error}</p>}
        </section>
      )}
    </div>
  );
}
