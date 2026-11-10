"use client";

import { useState } from "react";

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

function getSafeColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const color = value.trim();
  const isSafeColor =
    /^(#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|(?:rgb|hsl)a?\([\d.%\s,/-]+\)|[a-z]{1,20})$/i.test(
      color,
    );

  return isSafeColor ? color : fallback;
}

export default function SalesBrochureGenerator() {
  const [url, setUrl] = useState("");
  const [model, setModel] = useState("gpt-oss:latest");
  const [brochure, setBrochure] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBrochure(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL.replace(/\/+$/, "")}/generate-brochure`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, model }),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        const detail = result.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : "We couldn't generate a brochure for this website.",
        );
      }

      if (!result.data?.heading || !Array.isArray(result.data.bullet_points)) {
        throw new Error("The API returned an unexpected brochure response.");
      }

      setBrochure(result.data);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Couldn't reach the brochure API. Check that the FastAPI server is running on port 8000."
          : requestError.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-content">
      <header className="topbar">
        <div className="breadcrumb">
          <span>Workspace</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Sales brochure</span>
        </div>
        <div className="topbar-badge">
          <span className="sparkle" aria-hidden="true">✦</span>
          AI workspace
        </div>
      </header>

      <section className="intro">
        <div className="eyebrow"><span /> BROCHURE GENERATOR</div>
        <h1>Make a great first<br className="desktop-break" /> impression.</h1>
        <p>Turn any website into a clear, compelling sales brochure in seconds.</p>
      </section>

      <section className="generator-card" aria-labelledby="website-label">
        <form onSubmit={handleSubmit}>
          <div className="model-select">
            <label htmlFor="model">AI model</label>
            <select
              id="model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              {AVAILABLE_MODELS.map((availableModel) => (
                <option key={availableModel} value={availableModel}>
                  {availableModel}
                </option>
              ))}
            </select>
          </div>
          <label id="website-label" htmlFor="website-url">Website URL</label>
          <div className="url-entry">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8.25" />
              <path d="M3.9 12h16.2M12 3.75a12.1 12.1 0 0 1 0 16.5M12 3.75a12.1 12.1 0 0 0 0 16.5" />
            </svg>
            <input
              id="website-url"
              type="url"
              placeholder="https://yourcompany.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
              aria-describedby={error ? "form-error" : "url-hint"}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  Generate brochure
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 10h12M10 4l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </div>
          {error ? (
            <p className="error-message" id="form-error" role="alert">{error}</p>
          ) : (
            <p className="input-hint" id="url-hint">
              Paste a link to a company website. We&apos;ll take care of the rest.
            </p>
          )}
        </form>
      </section>

      {isLoading && (
        <div className="loading-note" role="status">
          <span className="loading-pulse" />
          Reading the website and crafting your brochure...
        </div>
      )}

      {brochure ? (
        <article
          className="brochure"
          aria-live="polite"
          style={{
            "--brochure-primary": getSafeColor(
              brochure.colors?.primary_color,
              "#6e9579",
            ),
            "--brochure-secondary": getSafeColor(
              brochure.colors?.secondary_color,
              "#acc6ad",
            ),
            "--brochure-tertiary": getSafeColor(
              brochure.colors?.tertiary_color,
              "#73a085",
            ),
          }}
        >
          <div className="brochure-topline">
            <span className="brochure-label"><span /> YOUR GENERATED BROCHURE</span>
            <span className="source-url">{url}</span>
          </div>
          <div className="brochure-body">
            <div className="brochure-copy">
              <div className="brochure-kicker">INTRODUCING</div>
              <h2>{brochure.heading}</h2>
              <p className="brochure-description">{brochure.description}</p>
              <div className="brochure-divider" />
              <h3>Why choose us</h3>
              <ul>
                {brochure.bullet_points.map((point, index) => (
                  <li key={`${index}-${point}`}>
                    <span className="bullet-check" aria-hidden="true">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              <div className="brochure-summary">
                <span className="summary-mark" aria-hidden="true">“</span>
                <p>{brochure.summary}</p>
              </div>
            </div>
            <div className="brochure-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-core"><span>✦</span></div>
              <div className="art-caption">A clearer story.<br />A stronger connection.</div>
            </div>
          </div>
          <div className="brochure-bottomline">
            <span>MADE WITH BROCHURE STUDIO</span>
            <span>Thoughtful stories start here.</span>
          </div>
        </article>
      ) : !isLoading ? (
        <section className="how-it-works">
          <div className="section-heading">
            <span>HOW IT WORKS</span>
            <span className="section-line" />
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-number">01</span>
              <div>
                <h2>Share a website</h2>
                <p>Enter the URL of the business you want to showcase.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">02</span>
              <div>
                <h2>We find the story</h2>
                <p>AI reads the site and picks out what makes it special.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">03</span>
              <div>
                <h2>Meet your brochure</h2>
                <p>Get a polished summary, ready to share with the world.</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
