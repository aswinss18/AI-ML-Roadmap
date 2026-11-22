"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Copy,
  FlaskConical,
  GraduationCap,
  ListChecks,
  Square,
  Waves,
  ArrowUpRight,
} from "lucide-react";
import { BotAvatar } from "@/components/bot-avatar";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ErrorNotice,
  Markdown,
  ModelBadge,
  ModelSelect,
  ResponseStatus,
  ThinkToggle,
  Thinking,
} from "@/components/studio-ui";

const STARTERS = [
  {
    icon: FlaskConical,
    title: "Everyday science",
    prompt: "Why does the sky look blue?",
  },
  {
    icon: ListChecks,
    title: "Make the math click",
    prompt: "Explain fractions with a simple example",
  },
  {
    icon: Waves,
    title: "Understand our world",
    prompt: "What is the difference between weather and climate?",
  },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
  const [think, setThink] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);
  const transcriptRef = useRef(null);
  const followRef = useRef(true);
  const [answerModel, setAnswerModel] = useState(model);
  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (followRef.current && transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [answer, submittedQuestion]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanQuestion = question.trim();

    if (!cleanQuestion || abortControllerRef.current) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    followRef.current = true;
    setSubmittedQuestion(cleanQuestion);
    setAnswerModel(model);
    setAnswer("");
    setError("");
    setWasStopped(false);
    setCopied(false);
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
          body: JSON.stringify({ question: cleanQuestion, model, think }),
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
      let hasAnswer = false;

      function appendContent(content) {
        hasAnswer ||= Boolean(content.trim());
        setAnswer((currentAnswer) => currentAnswer + content);
      }

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        let eventBoundary = buffer.search(/\r?\n\r?\n/);
        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(
            eventBoundary + (buffer[eventBoundary] === "\r" ? 4 : 2),
          );
          readEvent(rawEvent, appendContent);
          eventBoundary = buffer.search(/\r?\n\r?\n/);
        }

        if (done) {
          if (buffer.trim()) {
            readEvent(buffer, appendContent);
          }
          break;
        }
      }
      if (controller.signal.aborted) return;
      if (hasAnswer) {
        notify("Tutor answer ready.", "success");
      } else {
        setError(
          "No answer arrived. Try your question again or choose another model.",
        );
        notify("No tutor answer arrived. Try asking again.", "warning");
      }
    } catch (requestError) {
      if (abortControllerRef.current !== controller) return;
      if (requestError.name === "AbortError") {
        setWasStopped(true);
      } else {
        notify("The tutor could not finish the answer.", "error");
        setError(
          requestError instanceof TypeError
            ? "Couldn't reach the AI tutor API. Check that the tutor service is running, then try again."
            : requestError.message ||
                "Something went wrong while creating your answer. Please try again.",
        );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsStreaming(false);
      }
    }
  }

  function stopResponse(event) {
    event.preventDefault();
    abortControllerRef.current?.abort();
    notify("Tutor response stopped.");
    setWasStopped(true);
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      notify("Answer copied to clipboard.", "success");
    } catch {
      notify("Copy isn't available in this browser right now.", "error");
    }
  }

  return (
    <div
      className={`tutor-workspace conversation-workspace ${submittedQuestion ? "has-conversation" : "is-empty"}`}
    >
      <div className="session-toolbar">
        <span>
          <GraduationCap size={16} />
          Learning session
        </span>
        <span>One question at a time</span>
      </div>
      <div
        className="tutor-transcript"
        ref={transcriptRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          followRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
      >
        {submittedQuestion ? (
          <section className="tutor-explanation" aria-label="Tutor response">
            <div className="question-echo">
              <span>You</span>
              <p>{submittedQuestion}</p>
            </div>
            <article className="response-card">
              <header className="response-card-header">
                <BotAvatar name="tutor" size={30} className="response-avatar" />
                <div>
                  <h2>Your tutor</h2>
                  <ModelBadge>{answerModel}</ModelBadge>
                </div>
                {answer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAnswer}
                    disabled={isStreaming}
                    aria-label={copied ? "Answer copied" : "Copy answer"}
                  >
                    {copied ? <Check /> : <Copy />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </header>
              <div
                className="response-card-body"
                aria-live="polite"
                aria-busy={isStreaming}
              >
                {answer ? (
                  <Markdown>{answer}</Markdown>
                ) : isStreaming ? (
                  <Thinking text="Finding a clear way to explain it…" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {wasStopped
                      ? "You stopped this response. Ask again whenever you're ready."
                      : "No answer arrived. You can try your question again."}
                  </p>
                )}
              </div>
              <footer className="response-card-footer">
                <ResponseStatus active={isStreaming}>
                  {isStreaming
                    ? "Answer is streaming"
                    : wasStopped
                      ? "Response stopped"
                      : error
                        ? "Response interrupted"
                        : "Answer complete"}
                </ResponseStatus>
              </footer>
            </article>
          </section>
        ) : (
          <div className="conversation-intro">
            <BotAvatar name="tutor" size={32} className="intro-icon" />
            <span className="intro-caption">A SPACE TO UNDERSTAND</span>
            <h2>Make room for a new idea.</h2>
            <p>Work through a question. Find the explanation that clicks.</p>
          </div>
        )}
      </div>
      <div className="tutor-compose-area">
        <ErrorNotice title="Your answer couldn't finish">{error}</ErrorNotice>
        <Card className="question-composer">
          <form onSubmit={handleSubmit}>
            <Label htmlFor="tutor-question" className="sr-only">
              What would you like to understand?
            </Label>
            <Textarea
              ref={inputRef}
              id="tutor-question"
              className="question-textarea"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What would you like to understand?"
              rows={3}
              required
              disabled={isStreaming}
              aria-describedby="question-hint"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  (event.ctrlKey || event.metaKey) &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form.requestSubmit();
                }
              }}
            />
            <div className="composer-controls">
              <ModelSelect
                id="tutor-model"
                label="YOUR MODEL"
                value={model}
                onValueChange={setModel}
                disabled={isStreaming}
              />
              <div className="composer-action-group">
                <ThinkToggle think={think} onChange={setThink} disabled={isStreaming} />
                {isStreaming ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopResponse}
                  >
                    <Square className="size-3" />
                    Stop response
                  </Button>
                ) : (
                  <Button
                    className="primary-action"
                    type="submit"
                    disabled={!question.trim()}
                  >
                    <span>Help me understand</span>
                    <ArrowUp />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
        {!submittedQuestion && (
          <div className="starter-list">
            <span>Try a question</span>
            {STARTERS.map(({ icon: Icon, title, prompt }) => (
              <Button
                key={title}
                variant="ghost"
                onClick={() => {
                  setQuestion(prompt);
                  inputRef.current?.focus();
                }}
              >
                <Icon size={15} />
                <span>{title}</span>
                <ArrowUpRight size={13} />
              </Button>
            ))}
          </div>
        )}
        <div className="composer-note" id="question-hint">
          <span>Add context for a more useful explanation.</span>
          <span>
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send
          </span>
        </div>
      </div>
    </div>
  );
}
