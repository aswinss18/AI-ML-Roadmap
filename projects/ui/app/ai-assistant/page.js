"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./genie.css";

const API_URL = (process.env.NEXT_PUBLIC_GENIE_API_BASE_URL || "http://localhost:8002").replace(/\/+$/, "");
const SUGGESTIONS = [
  { title: "Make it make sense", label: "Understand something new", icon: "learn", prompt: "Explain how large language models work using a simple everyday analogy." },
  { title: "Find the right words", label: "Write with a little help", icon: "write", prompt: "Help me write a friendly, professional email. Ask me who it is for and what I want to say." },
  { title: "Untangle an idea", label: "Think through the possibilities", icon: "idea", prompt: "Help me brainstorm a small AI project I could build this weekend. Ask about my interests first." },
  { title: "Get a fresh perspective", label: "Make a plan that works", icon: "plan", prompt: "Help me break a big goal into small, achievable steps. Ask me what I want to accomplish." },
];

function Icon({ name = "spark", ...props }) {
  const paths = {
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M21 2v4M19 4h4" /></>,
    learn: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z" /><path d="M12 6v14" /></>,
    write: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z" /></>,
    idea: <><path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0l-1 2H9l-1-2Z" /></>,
    plan: <><rect x="4" y="4" width="16" height="17" rx="3" /><path d="M8 2v4M16 2v4M8 11h8M8 15h5" /></>,
    send: <><path d="M12 20V4m-6 6 6-6 6 6" /></>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 5V3H3v13h2" /></>,
    refresh: <><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

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

  const loadModels = useCallback(async () => {
    modelsRequestRef.current?.abort();
    const controller = new AbortController();
    modelsRequestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_URL}/models`, { signal: controller.signal });
      if (!response.ok) throw new Error("Could not load models. Check that Genie and Ollama are running, then retry.");
      const data = await response.json();
      setModelError("");
      const available = Array.isArray(data.models) ? [...new Set(data.models.filter((item) => typeof item === "string" && item.trim()))] : [];
      setModels(available);
      setModel((current) => available.includes(current) ? current : (available[0] || ""));
      if (!available.length) setModelError("No models found. Install a model in Ollama, then refresh the list.");
    } catch (err) {
      if (modelsRequestRef.current !== controller) return;
      setModels([]);
      setModel("");
      setModelError(err.name === "AbortError" ? "Loading models timed out. Check the API and try again." : err instanceof TypeError ? "Cannot reach Genie. Start the assistant API, then retry." : err.message);
    } finally {
      clearTimeout(timeout);
      if (modelsRequestRef.current === controller) setLoadingModels(false);
    }
  }, []);

  function refreshModels() {
    setLoadingModels(true);
    setModelError("");
    loadModels();
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
    setMessages((current) => [...current, { id: `${id}-user`, role: "user", content: message }, { id, role: "assistant", content: "", model }]);
    setDraft("");
    setError("");
    setStatus("Genie is thinking…");
    setStreaming(true);
    let content = "";
    function updateReply(extra) {
      content += extra;
      setMessages((current) => current.map((item) => item.id === id ? { ...item, content } : item));
    }
    try {
      const response = await fetch(`${API_URL}/chat-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ message, model }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.detail === "string" ? data.detail : `Genie could not answer (HTTP ${response.status}). Please try again.`);
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
      if (!content.trim()) throw new Error("Genie returned an empty answer. Try another model.");
      if (content.includes("Error: The assistant response stream was interrupted.")) {
        throw new Error("The reply was interrupted on the server. You can send a follow-up to continue.");
      }
      setStatus("Reply complete.");
    } catch (err) {
      if (controller.signal.aborted) {
        setStatus("Reply stopped.");
        setMessages((current) => current.map((item) => item.id === id ? { ...item, note: "Reply stopped" } : item));
      } else {
        setError(err instanceof TypeError ? "Connection lost. Check that the Genie API is running, then send your message again." : err.message);
        setStatus("");
        setMessages((current) => current.map((item) => item.id === id ? { ...item, note: "Reply incomplete" } : item));
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
      setStatus("Reply copied.");
    } catch {
      setStatus("Copy is unavailable. Select the reply text to copy it manually.");
    }
  }

  return (
    <div className="genie-page">
      <header className="genie-topbar">
        <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><span className="breadcrumb-current">Genie assistant</span></div>
        <span className="genie-badge"><Icon /> Your everyday copilot</span>
      </header>

      <section className="genie-workspace" aria-label="Genie assistant">
        <div className="genie-toolbar">
          <div className="genie-identity"><span className="genie-avatar"><Icon /></span><div><h1>Genie</h1><p>A little help, a world of possibility.</p></div></div>
          <div className="genie-model">
            <label htmlFor="genie-model">YOUR MODEL</label>
            <div><select id="genie-model" value={model} disabled={loadingModels || streaming || !models.length} onChange={(event) => setModel(event.target.value)}>
              {!models.length && <option value="">{loadingModels ? "Finding models…" : "No model available"}</option>}
              {models.map((item) => <option key={item} value={item}>{item}</option>)}
            </select><button type="button" className="genie-icon-button" aria-label="Refresh models" title="Refresh models" disabled={loadingModels || streaming} onClick={refreshModels}><Icon name="refresh" /></button></div>
          </div>
        </div>

        {modelError && <div className="genie-error" role="alert"><span>{modelError}</span><button type="button" onClick={refreshModels} disabled={loadingModels}>Retry</button></div>}

        <div className="genie-transcript" ref={transcriptRef} onScroll={(event) => { const el = event.currentTarget; followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100; }}>
          {!messages.length ? <div className="genie-welcome">
            <div className="genie-welcome-symbol" aria-hidden="true"><Icon /><span className="genie-orbit" /></div>
            <p className="genie-eyebrow">A SPACE FOR YOUR CURIOSITY</p>
            <h2>Big ideas start with<br />a little <em>conversation.</em></h2>
            <p className="genie-welcome-copy">Hi, I’m Genie. Let’s untangle a question, find the right words,<br className="genie-desktop-break" /> or turn that “what if” into your next good idea.</p>
            <div className="genie-suggestions">{SUGGESTIONS.map((item) => <button type="button" key={item.icon} onClick={() => { setDraft(item.prompt); inputRef.current?.focus(); }}><Icon name={item.icon} /><strong>{item.title}</strong><span>{item.label}</span><span className="genie-card-arrow" aria-hidden="true">↗</span></button>)}</div>
          </div> : <div className="genie-messages" aria-label="Conversation">{messages.map((message, index) => <article key={message.id} className={`genie-message genie-message-${message.role}`} aria-label={message.role === "user" ? "Your message" : "Genie reply"}>
            <div className="genie-message-avatar" aria-hidden="true">{message.role === "assistant" ? <Icon /> : "Y"}</div>
            <div className="genie-message-body"><header><strong>{message.role === "assistant" ? "Genie" : "You"}</strong>{message.model && <span>{message.model}</span>}</header>
              {message.role === "user" ? <p className="genie-user-text">{message.content}</p> : <div className="tutor-markdown genie-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>{!message.content && streaming && index === messages.length - 1 && <span className="genie-thinking">Thinking<span>…</span></span>}</div>}
              {message.note && <p className="genie-message-note">{message.note}</p>}
              {message.role === "assistant" && message.content && !(streaming && index === messages.length - 1) && <button className="genie-copy" type="button" onClick={() => copyMessage(message)}><Icon name="copy" />{copiedId === message.id ? "Copied" : "Copy reply"}</button>}
            </div>
          </article>)}</div>}
        </div>

        <div className="genie-compose-area">
          {error && <div className="genie-error" role="alert">{error}</div>}
          <form className="genie-composer" onSubmit={sendMessage}>
            <label htmlFor="genie-message" className="genie-sr-only">Message Genie</label>
            <textarea ref={inputRef} id="genie-message" value={draft} rows={2} placeholder="What’s on your mind?" maxLength={20000} aria-describedby="genie-input-hint" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} />
            <div className="genie-composer-footer"><span><Icon /> A little curiosity goes a long way</span>{streaming ? <button type="button" className="genie-send" onClick={() => requestRef.current?.abort()}><span className="genie-stop-icon" />Stop</button> : <button type="submit" className="genie-send" disabled={!draft.trim() || !model || loadingModels}>Send message<Icon name="send" /></button>}</div>
          </form>
          <div className="genie-bottom-note"><span id="genie-input-hint">Enter to send · Shift + Enter for a new line</span><span>Genie can make mistakes. Stay curious.</span></div>
          <p className="genie-sr-only" role="status" aria-live="polite">{status}</p>
        </div>
      </section>
    </div>
  );
}
