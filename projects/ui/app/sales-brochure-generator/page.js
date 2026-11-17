"use client";

import { useRef, useState, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  Copy,
  FileText,
  Globe2,
  Loader2,
  ScanText,
  AlignLeft,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorNotice, ModelSelect, Thinking } from "@/components/studio-ui";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");
function getSafeColor(value, fallback = "#7863cb") {
  return typeof value === "string" &&
    /^(#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|(?:rgb|hsl|oklab|oklch|lab|lch|color)a?\([\w\s,.%/#-]+\)|[a-z]{1,20})$/i.test(
      value.trim(),
    )
    ? value.trim()
    : fallback;
}
function toMarkdown(brochure) {
  return `# ${brochure.heading}\n\n${brochure.description}\n\n## Why choose us\n\n${brochure.bullet_points.map((point) => `- ${point}`).join("\n")}\n\n${brochure.summary}`;
}

export default function SalesBrochureGenerator() {
  const [url, setUrl] = useState("");
  const [model, setModel] = useState("gpt-oss:latest");
  const [brochure, setBrochure] = useState(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requestRef = useRef(null);
  const urlRef = useRef(null);
  const [layout, setLayout] = useState("editorial");
  const [view, setView] = useState("preview");
  useEffect(
    () => () => {
      requestRef.current?.abort();
      requestRef.current = null;
    },
    [],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (requestRef.current) return;
    const controller = new AbortController();
    const submittedUrl = url.trim();
    requestRef.current = controller;
    setError("");
    setView("preview");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-brochure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: submittedUrl, model }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "We couldn't generate a brochure for this website. Try another URL.",
        );
      if (
        typeof result.data?.heading !== "string" ||
        !result.data.heading.trim() ||
        typeof result.data.description !== "string" ||
        typeof result.data.summary !== "string" ||
        !Array.isArray(result.data.bullet_points) ||
        !result.data.bullet_points.every((point) => typeof point === "string")
      )
        throw new Error(
          "The service returned an unexpected brochure. Please try again.",
        );
      if (controller.signal.aborted) return;
      setBrochure(result.data);
      setSource(submittedUrl);
      notify("Brochure draft ready.", "success");
    } catch (err) {
      if (err.name !== "AbortError") {
        notify("Could not create the brochure.", "error");
        setError(
          err instanceof TypeError
            ? "We couldn't connect to the brochure service. Check that it's running, then try again."
            : err.message,
        );
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsLoading(false);
      }
    }
  }
  async function copyBrochure() {
    try {
      await navigator.clipboard.writeText(toMarkdown(brochure));
      notify("Brochure copied to clipboard.", "success");
    } catch {
      notify(
        "Copy is unavailable. Use Download to save your brochure.",
        "error",
      );
    }
  }
  function downloadBrochure() {
    const objectUrl = URL.createObjectURL(
      new Blob([toMarkdown(brochure)], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "sales-brochure.md";
    link.click();
    notify("Brochure download started.", "success");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
  return (
    <div className="document-workbench">
      <aside className="workbench-inspector" aria-label="Brochure settings">
        <div className="inspector-heading">
          <FileText size={16} />
          <h2>Document setup</h2>
        </div>
        <form onSubmit={handleSubmit} className="inspector-form">
          <div className="inspector-section">
            <div className="section-caption">
              <span>01</span>
              <h3>Source</h3>
            </div>
            <div className="field-group">
              <Label htmlFor="website-url">Website URL</Label>
              <div className="input-with-icon">
                <Globe2 size={15} />
                <Input
                  ref={urlRef}
                  id="website-url"
                  type="url"
                  placeholder="https://company.com"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  required
                  disabled={isLoading}
                  aria-describedby="url-hint"
                />
              </div>
              <p className="field-hint" id="url-hint">
                A public company or product website.
              </p>
            </div>
            <ModelSelect
              id="brochure-model"
              value={model}
              onValueChange={setModel}
              disabled={isLoading}
            />
          </div>
          <div className="inspector-section">
            <div className="section-caption">
              <span>02</span>
              <h3>Presentation</h3>
            </div>
            <Label id="layout-label">Document layout</Label>
            <div
              className="layout-options"
              role="group"
              aria-labelledby="layout-label"
            >
              {["editorial", "minimal"].map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  className="layout-option"
                  aria-pressed={layout === item}
                  onClick={() => setLayout(item)}
                >
                  <span
                    className={`layout-thumbnail ${item}`}
                    aria-hidden="true"
                  >
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>{item === "editorial" ? "Editorial" : "Minimal"}</span>
                  {layout === item && <Check size={12} />}
                </Button>
              ))}
            </div>
          </div>
          <div className="inspector-section document-outline">
            <div className="section-caption">
              <span>03</span>
              <h3>Document outline</h3>
            </div>
            {["Company introduction", "Key benefits", "Closing statement"].map(
              (item, index) => (
                <div key={item}>
                  <span className="outline-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                  {brochure ? (
                    <Check size={13} />
                  ) : (
                    <span className="outline-dash">—</span>
                  )}
                </div>
              ),
            )}
          </div>
          <div className="inspector-submit">
            <ErrorNotice title="Couldn't create your brochure">
              {error}
            </ErrorNotice>
            <Button
              type="submit"
              className="primary-action w-full"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating brochure…
                </>
              ) : (
                <>
                  Generate brochure
                  <ArrowRight className="ml-auto" />
                </>
              )}
            </Button>
            <p className="field-hint">
              Create a draft, then review and export.
            </p>
          </div>
        </form>
      </aside>
      <Tabs value={view} onValueChange={setView} className="document-editor">
        <div className="editor-toolbar">
          <TabsList className="toolbar-tabs">
            <TabsTrigger value="preview">
              <LayoutTemplate size={14} />
              Preview
            </TabsTrigger>
            <TabsTrigger value="text" disabled={!brochure || isLoading}>
              <AlignLeft size={14} />
              Plain text
            </TabsTrigger>
          </TabsList>
          <div className="toolbar-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyBrochure}
              disabled={!brochure || isLoading}
              aria-label="Copy brochure"
            >
              <Copy />
              <span>Copy</span>
            </Button>
            <Separator orientation="vertical" />
            <Button
              variant="outline"
              size="sm"
              onClick={downloadBrochure}
              disabled={!brochure || isLoading}
            >
              <ArrowDownToLine />
              <span>Download</span>
            </Button>
          </div>
        </div>
        <TabsContent value="preview" className="document-stage">
          <div className="canvas-caption">
            <span>{brochure ? "Company brochure" : "Untitled brochure"}</span>
            <span>
              {isLoading ? "Generating" : brochure ? "Draft" : "Not generated"}
            </span>
          </div>
          {isLoading ? (
            <div className="document-paper document-loading">
              <ScanText size={24} />
              <h2>Composing your brochure</h2>
              <p>Reading your website and extracting the essentials.</p>
              <Thinking text="Working on your first draft…" />
            </div>
          ) : brochure ? (
            <article
              className={`document-paper brochure-document ${layout}`}
              style={{
                "--document-primary": getSafeColor(
                  brochure.colors?.primary_color,
                  "#3458d5",
                ),
                "--document-secondary": getSafeColor(
                  brochure.colors?.secondary_color,
                  "#d8e1f4",
                ),
                "--document-tertiary": getSafeColor(
                  brochure.colors?.tertiary_color,
                  "#3458d5",
                ),
              }}
            >
              <div className="document-top">
                <span>COMPANY OVERVIEW</span>
                <Globe2 size={17} />
              </div>
              <div className="document-heading">
                <span className="document-eyebrow">INTRODUCING</span>
                <h2>{brochure.heading}</h2>
                <p className="document-description">{brochure.description}</p>
              </div>
              <Separator />
              <div className="document-benefits">
                <h3>What sets us apart</h3>
                <ul>
                  {brochure.bullet_points.map((point, index) => (
                    <li key={index}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{point}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <blockquote>{brochure.summary}</blockquote>
              <div className="document-bottom">
                <span>{source}</span>
                <span>01</span>
              </div>
            </article>
          ) : (
            <div className={`document-paper blank-document ${layout}`}>
              <div className="document-top">
                <span>COMPANY OVERVIEW</span>
                <span>01</span>
              </div>
              <div className="blank-document-center">
                <span className="blank-document-icon">
                  <FileText size={24} strokeWidth={1.3} />
                </span>
                <h2>
                  A blank page.
                  <br />A clear starting point.
                </h2>
                <p>
                  Add your website to turn your business
                  <br className="desktop-break" /> into a considered company
                  overview.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => urlRef.current?.focus()}
                >
                  Add a website
                  <ArrowRight size={14} />
                </Button>
              </div>
              <div className="blank-document-footer">
                <span>INTRODUCTION</span>
                <span>BENEFITS</span>
                <span>SUMMARY</span>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="text" className="document-stage">
          <pre className="brochure-plain-text">
            {brochure ? toMarkdown(brochure) : ""}
          </pre>
        </TabsContent>
        <div className="editor-statusbar">
          <span className="copy-status" role="status">
            {isLoading
              ? "Generating your document…"
              : brochure
                ? "Draft ready · Review before sharing"
                : "Add a source to get started"}
          </span>
          <span>
            Markdown export<span className="status-divider">/</span>1 page
          </span>
        </div>
      </Tabs>
    </div>
  );
}
