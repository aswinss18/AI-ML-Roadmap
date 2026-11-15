"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Copy,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageCircle,
  Square,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ErrorNotice,
  Markdown,
  ModelBadge,
  ModelSelect,
  PageHeading,
  PromptCard,
  ResponseStatus,
  Thinking,
  ToolFooter,
} from "@/components/studio-ui";

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
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);
  const [answerModel, setAnswerModel] = useState(model);
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanQuestion = question.trim();

    if (!cleanQuestion || abortControllerRef.current) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSubmittedQuestion(cleanQuestion);
    setAnswerModel(model);
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

        let eventBoundary = buffer.search(/\r?\n\r?\n/);
        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(
            eventBoundary + (buffer[eventBoundary] === "\r" ? 4 : 2),
          );
          readEvent(rawEvent, (content) => {
            setAnswer((currentAnswer) => currentAnswer + content);
          });
          eventBoundary = buffer.search(/\r?\n\r?\n/);
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
            ? "Couldn't reach the AI tutor API. Check that the tutor service is running, then try again."
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
    <div className="studio-page tutor-page">
      <PageHeading
        eyebrow="FOLLOW YOUR CURIOSITY"
        title="AI tutor"
        description="Understand a new concept, work through a question, or explore an idea in depth."
        icon={BookOpen}
      />

      <div className="tutor-workspace">
        <div className="tutor-main">
          <Card className="question-composer">
            <form onSubmit={handleSubmit}>
              <div className="composer-heading">
                <Label htmlFor="tutor-question">
                  What would you like to understand?
                </Label>
                <MessageCircle size={17} />
              </div>
              <Textarea
                ref={inputRef}
                id="tutor-question"
                className="question-textarea"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question, unpack an idea, or explore something new…"
                rows={4}
                required
                disabled={isStreaming}
                aria-describedby="question-hint"
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
                  {isStreaming ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopResponse}
                    >
                      <Square className="size-3" />
                      Stop response
                    </Button>
                  ) : null}
                  <Button
                    className="primary-action"
                    type="submit"
                    disabled={isStreaming || !question.trim()}
                  >
                    {isStreaming ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Thinking…
                      </>
                    ) : (
                      <>
                        Help me understand
                        <ArrowRight />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
          <p className="field-hint -mt-2" id="question-hint">
            A little context helps. Tell your tutor what you already know.
          </p>
          <ErrorNotice title="Your answer couldn't finish">{error}</ErrorNotice>
          {submittedQuestion ? (
            <section aria-label="Tutor response">
              <div className="question-echo">
                <span>Y</span>
                <div>
                  <strong>YOUR QUESTION</strong>
                  <p>{submittedQuestion}</p>
                </div>
              </div>
              <Card className="response-card">
                <header className="response-card-header">
                  <span className="response-avatar">
                    <GraduationCap size={18} />
                  </span>
                  <div>
                    <h2>Your tutor</h2>
                    <ModelBadge>{answerModel}</ModelBadge>
                  </div>
                  {answer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAnswer}
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
                {copyError && (
                  <p className="copy-status" role="status">
                    {copyError}
                  </p>
                )}
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
                  <span>Review important details for accuracy.</span>
                </footer>
              </Card>
            </section>
          ) : (
            <section className="starter-section">
              <div className="starter-section-title">
                <h2>A few places to start</h2>
                <span>Follow what interests you</span>
              </div>
              <div className="starter-grid">
                {[
                  {
                    icon: FlaskConical,
                    title: "Everyday science",
                    description: "Why does the sky look blue?",
                    prompt: "Why does the sky look blue?",
                  },
                  {
                    icon: ListChecks,
                    title: "Make the math click",
                    description: "Fractions, without the confusion.",
                    prompt: "Explain fractions with a simple example",
                  },
                  {
                    icon: Waves,
                    title: "Understand our world",
                    description: "Weather vs. climate. What's the difference?",
                    prompt:
                      "What is the difference between weather and climate?",
                  },
                ].map(({ prompt, ...props }) => (
                  <PromptCard
                    key={prompt}
                    {...props}
                    onClick={() => {
                      setQuestion(prompt);
                      inputRef.current?.focus();
                    }}
                  />
                ))}
              </div>
              <div className="learning-empty">
                <span>
                  <BookOpen size={30} strokeWidth={1.3} />
                </span>
                <div>
                  <h3>Your explanation will appear here.</h3>
                  <p>
                    Send a question and watch the explanation come together.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
        <aside className="study-sidebar" aria-label="Tips for learning">
          <span className="small-section-label">A LITTLE GUIDANCE</span>
          <div className="study-tip">
            <Lightbulb size={20} />
            <h3>Start with the confusing part.</h3>
            <p>
              You don&apos;t need the perfect question. A rough idea is a good
              place to begin.
            </p>
          </div>
          <div className="study-tip">
            <ListChecks size={20} />
            <h3>Ask for an example.</h3>
            <p>
              Make an abstract idea feel familiar with a real situation or a
              simple analogy.
            </p>
          </div>
          <div className="study-tip">
            <Compass size={20} />
            <h3>Go at your own pace.</h3>
            <p>
              Ask a new question to explore another angle. Every explanation is
              a fresh start.
            </p>
          </div>
        </aside>
      </div>
      <ToolFooter>
        Explanations are generated by your selected model.
      </ToolFooter>
    </div>
  );
}
