"use client";

import { useRef, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const AVAILABLE_MODELS = [
  "meditron:latest",
  "deepseek-r1:1.5b",
  "llama3.2:latest",
  "gpt-oss:latest",
  "phi3:latest",
  "gemma3:270m",
];
const SUGGESTED_QUESTIONS = [
  "Why does the sky look blue?",
  "Explain fractions with a simple example",
  "What is the difference between weather and climate?",
];

function getErrorMessage(detail, fallback) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  return fallback;
}

function readEvent(rawEvent, onContent) {
  const lines = rawEvent.split(/\r?\n/);
  const eventName = lines
    .find((line) => line.startsWith("event:"))
    ?.slice("event:".length)
    .trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trimStart())
    .join("\n");

  if (!data || data === "[DONE]") {
    return;
  }

  const payload = JSON.parse(data);
  if (eventName === "error") {
    throw new Error(
      getErrorMessage(
        payload.detail,
        "The AI tutor couldn't finish this answer. Please try again.",
      ),
    );
  }

  if (typeof payload.content === "string") {
    onContent(payload.content);
  }
}

export default function AiTutorPage() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [model, setModel] = useState("llama3.2:latest");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const abortControllerRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanQuestion = question.trim();

    if (!cleanQuestion || isStreaming) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSubmittedQuestion(cleanQuestion);
    setAnswer("");
    setError("");
    setWasStopped(false);
    setCopied(false);
    setCopyError("");
    setIsStreaming(true);

    try {
      const response = await fetch(
        `${API_BASE_URL.replace(/\/+$/, "")}/teach-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ question: cleanQuestion, model }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        let detail;
        try {
          const result = await response.json();
          detail = result.detail;
        } catch (parseError) {
          if (!(parseError instanceof SyntaxError)) {
            throw parseError;
          }
        }

        throw new Error(
          getErrorMessage(
            detail,
            "The AI tutor couldn't start this answer. Please try again.",
          ),
        );
      }

      if (!response.body) {
        throw new Error("The AI tutor returned an empty response stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        let eventBoundary = buffer.indexOf("\n\n");
        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(eventBoundary + 2);
          readEvent(rawEvent, (content) => {
            setAnswer((currentAnswer) => currentAnswer + content);
          });
          eventBoundary = buffer.indexOf("\n\n");
        }

        if (done) {
          if (buffer.trim()) {
            readEvent(buffer, (content) => {
              setAnswer((currentAnswer) => currentAnswer + content);
            });
          }
          break;
        }
      }
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        setWasStopped(true);
      } else {
        setError(
          requestError instanceof TypeError
            ? "Couldn't reach the AI tutor API. Check that the FastAPI server is running on port 8000."
            : requestError.message ||
                "Something went wrong while creating your answer. Please try again.",
        );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
    }
  }

  function stopResponse() {
    abortControllerRef.current?.abort();
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError("Copy isn't available in this browser right now.");
    }
  }

  return (
    <div className="page-content tutor-page">
      <header className="topbar">
        <div className="breadcrumb">
          <span>Workspace</span>
          <span className="breadcrumb-separator" aria-hidden="true">/</span>
          <span className="breadcrumb-current">AI tutor</span>
        </div>
        <div className="topbar-badge">
          <span className="sparkle" aria-hidden="true">✦</span>
          Your patient study partner
        </div>
      </header>

      <section className="tutor-intro">
        <div className="eyebrow"><span /> YOUR PERSONAL AI TUTOR</div>
        <div className="tutor-heading-row">
          <div>
            <h1>Big questions,<br />made simple.</h1>
            <p>
              Bring any question. Get a clear, step by step explanation that
              helps the idea really click.
            </p>
          </div>
          <div className="tutor-illustration" aria-hidden="true">
            <span className="illustration-orbit illustration-orbit-one" />
            <span className="illustration-orbit illustration-orbit-two" />
            <span className="illustration-core">
              <svg viewBox="0 0 32 32">
                <path d="M16 5.5 18.7 13l7.8 3-7.8 2.8-2.7 7.7-2.8-7.7-7.7-2.8 7.7-3L16 5.5Z" />
              </svg>
            </span>
            <span className="illustration-caption">Curiosity starts<br />with one question</span>
          </div>
        </div>
      </section>

      <div className="tutor-layout">
        <div className="tutor-main-column">
          <section className="tutor-composer" aria-labelledby="question-label">
            <form onSubmit={handleSubmit}>
              <div className="tutor-composer-top">
                <div>
                  <label className="tutor-field-label" htmlFor="tutor-question" id="question-label">
                    What would you like to understand?
                  </label>
                  <p className="tutor-field-hint" id="question-hint">
                    Ask in your own words. There are no wrong questions.
                  </p>
                </div>
                <label className="model-select tutor-model-select" htmlFor="tutor-model">
                  <span>MODEL</span>
                  <select
                    id="tutor-model"
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    disabled={isStreaming}
                  >
                    {AVAILABLE_MODELS.map((availableModel) => (
                      <option key={availableModel} value={availableModel}>
                        {availableModel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <textarea
                id="tutor-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="For example, how do airplanes stay in the air?"
                rows={4}
                required
                disabled={isStreaming}
                aria-describedby="question-hint"
              />
              <div className="tutor-composer-footer">
                <span className="tutor-privacy-note">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M10 2.75 16 5v4.3c0 3.7-2.4 6.1-6 7.95-3.6-1.85-6-4.25-6-7.95V5l6-2.25Z" />
                    <path d="m7.5 9.75 1.65 1.65 3.5-3.5" />
                  </svg>
                  Powered by your selected Ollama model
                </span>
                <div className="tutor-form-actions">
                  {isStreaming && (
                    <button
                      className="tutor-stop-button"
                      type="button"
                      onClick={stopResponse}
                    >
                      Stop response
                    </button>
                  )}
                  <button
                    className="tutor-submit-button"
                    type="submit"
                    disabled={isStreaming || !question.trim()}
                  >
                    {isStreaming ? "Teaching..." : "Help me understand"}
                    {!isStreaming && (
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M4 10h12M10 4l6 6-6 6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {error && (
            <div className="tutor-error" role="alert">
              <span className="tutor-error-mark" aria-hidden="true">!</span>
              <p>{error}</p>
            </div>
          )}

          <section className="tutor-answer-section" aria-label="Tutor response">
            {submittedQuestion ? (
              <>
                <div className="tutor-question-card">
                  <span className="tutor-message-avatar question-avatar" aria-hidden="true">Y</span>
                  <div>
                    <span className="tutor-message-label">YOUR QUESTION</span>
                    <p>{submittedQuestion}</p>
                  </div>
                </div>
                <article className="tutor-answer-card" aria-labelledby="answer-heading">
                  <header className="tutor-answer-header">
                    <div className="tutor-answer-identity">
                      <span className="tutor-message-avatar answer-avatar" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="m12 3 2 5.4 5.5 2-5.5 2.1-2 5.5-2-5.5-5.5-2.1 5.5-2L12 3Z" />
                        </svg>
                      </span>
                      <div>
                        <h2 id="answer-heading">Your tutor</h2>
                        <span className="tutor-model-caption">
                          {isStreaming ? "Putting it into simple words" : model}
                        </span>
                      </div>
                    </div>
                    {answer && (
                      <button
                        className="tutor-copy-button"
                        type="button"
                        onClick={copyAnswer}
                        aria-label={copied ? "Answer copied" : "Copy answer"}
                      >
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <rect x="7" y="6" width="9" height="11" rx="1.5" />
                          <path d="M12.5 6V4.5A1.5 1.5 0 0 0 11 3H5.5A1.5 1.5 0 0 0 4 4.5v8A1.5 1.5 0 0 0 5.5 14H7" />
                        </svg>
                        {copied ? "Copied" : "Copy"}
                      </button>
                    )}
                  </header>
                  <div className="tutor-answer-body" aria-live="off">
                    {answer ? (
                      <p>{answer}</p>
                    ) : (
                      <div className="tutor-thinking">
                        <span className="thinking-dots" aria-hidden="true">
                          <span /><span /><span />
                        </span>
                        <span>Finding a clear way to explain it...</span>
                      </div>
                    )}
                  </div>
                  {copyError && <p className="tutor-copy-error" role="status">{copyError}</p>}
                  <footer className="tutor-answer-footer">
                    <span className="tutor-stream-status" role="status">
                      <span className={isStreaming ? "stream-status-dot is-active" : "stream-status-dot"} />
                      {isStreaming
                        ? "Answer is streaming"
                        : wasStopped
                          ? "Response stopped"
                          : error
                            ? "Response interrupted"
                            : "Answer complete"}
                    </span>
                    <span>Take your time. Learning happens one step at a time.</span>
                  </footer>
                </article>
              </>
            ) : (
              <div className="tutor-empty-state">
                <div className="empty-state-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <path d="M8 12.5A3.5 3.5 0 0 1 11.5 9H24v29H11.5A3.5 3.5 0 0 0 8 41.5v-29Z" />
                    <path d="M40 12.5A3.5 3.5 0 0 0 36.5 9H24v29h12.5a3.5 3.5 0 0 1 3.5 3.5v-29Z" />
                    <path d="M13 16h6M13 21h6M29 16h6M29 21h6" />
                  </svg>
                </div>
                <div>
                  <h2>Your next “aha” moment starts here</h2>
                  <p>Send a question and your tutor will build the answer as it thinks.</p>
                </div>
                <div className="suggested-questions" aria-label="Try asking">
                  {SUGGESTED_QUESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                      disabled={isStreaming}
                    >
                      {suggestion}
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3 8h10M8 3l5 5-5 5" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="tutor-guide-card" aria-labelledby="guide-heading">
          <div className="guide-card-topline">
            <span className="guide-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3.25 14.3 9.7l6.45 2.3-6.45 2.3L12 20.75l-2.3-6.45L3.25 12l6.45-2.3L12 3.25Z" />
              </svg>
            </span>
            <span>LEARNING, YOUR WAY</span>
          </div>
          <h2 id="guide-heading">A good tutor makes space for curiosity.</h2>
          <p className="guide-description">
            Your AI tutor explains ideas in simple language, then adds the
            context that makes them stick.
          </p>
          <ol className="guide-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Ask freely</h3>
                <p>Start with what you know, or what feels confusing.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Follow the idea</h3>
                <p>Watch the explanation arrive, one piece at a time.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Keep exploring</h3>
                <p>Ask a follow up whenever you want to go deeper.</p>
              </div>
            </li>
          </ol>
          <div className="guide-card-footer">
            <span className="guide-online-dot" />
            <span>Ready whenever you are</span>
          </div>
        </aside>
      </div>

      <footer className="tutor-page-footer">
        <span>Made for curious minds.</span>
        <span>Clear answers. No rush.</span>
      </footer>
    </div>
  );
}
