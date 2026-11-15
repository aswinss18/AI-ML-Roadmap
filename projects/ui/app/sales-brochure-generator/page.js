"use client";

import { useRef, useState, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  Copy,
  FileText,
  Globe2,
  Layers2,
  Loader2,
  ScanText,
  WandSparkles,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ErrorNotice,
  ModelSelect,
  PageHeading,
  ResponseStatus,
  StepLabel,
  Thinking,
  ToolFooter,
} from "@/components/studio-ui";

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
  const [copyStatus, setCopyStatus] = useState("");
  const requestRef = useRef(null);
  useEffect(() => () => requestRef.current?.abort(), []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setError("");
    setBrochure(null);
    setCopyStatus("");
    setIsLoading(true);
    setSource(url.trim());
    try {
      const response = await fetch(`${API_BASE_URL}/generate-brochure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), model }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "We couldn't generate a brochure for this website. Try another URL.",
        );
      if (!result.data?.heading || !Array.isArray(result.data.bullet_points))
        throw new Error(
          "The service returned an unexpected brochure. Please try again.",
        );
      setBrochure(result.data);
    } catch (err) {
      if (err.name !== "AbortError")
        setError(
          err instanceof TypeError
            ? "We couldn't connect to the brochure service. Check that it's running, then try again."
            : err.message,
        );
    } finally {
      requestRef.current = null;
      setIsLoading(false);
    }
  }
  async function copyBrochure() {
    try {
      await navigator.clipboard.writeText(toMarkdown(brochure));
      setCopyStatus("Copied to clipboard");
    } catch {
      setCopyStatus("Copy is unavailable. Use Download to save your brochure.");
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
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
  return (
    <div className="studio-page brochure-page">
      <PageHeading
        eyebrow="CREATE SOMETHING GREAT"
        title="Sales brochure"
        description="Turn your website into a company overview. Review it, make it yours, and share it."
        icon={FileText}
      />

      <div className="brochure-workspace">
        <div className="brochure-config">
          <Card className="config-card">
            <CardHeader>
              <StepLabel number="01">Configuration</StepLabel>
              <CardTitle>Start with a website</CardTitle>
              <CardDescription>
                We’ll use the content to create your brochure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="studio-form">
                <div className="field-group">
                  <Label htmlFor="website-url">Website URL</Label>
                  <div className="input-with-icon">
                    <Globe2 size={16} />
                    <Input
                      id="website-url"
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      required
                      disabled={isLoading}
                      aria-describedby="url-hint"
                    />
                  </div>
                  <p className="field-hint" id="url-hint">
                    Use a public company or product website.
                  </p>
                </div>
                <ModelSelect
                  id="brochure-model"
                  value={model}
                  onValueChange={setModel}
                  disabled={isLoading}
                />
                <Separator />
                <div className="output-detail">
                  <span className="output-detail-icon">
                    <Layers2 size={18} />
                  </span>
                  <div>
                    <strong>Included in your brochure</strong>
                    <p>
                      Headline, introduction, key benefits, and a closing
                      statement.
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="primary-action w-full"
                  disabled={isLoading || !url.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Creating your brochure…
                    </>
                  ) : (
                    <>
                      <WandSparkles />
                      Generate brochure
                      <ArrowRight className="ml-auto" />
                    </>
                  )}
                </Button>
                <p className="form-footnote">
                  Generated content can be reviewed before sharing.
                </p>
                <ErrorNotice title="Couldn't create your brochure">
                  {error}
                </ErrorNotice>
              </form>
            </CardContent>
          </Card>
          <div className="workflow-guide">
            <span className="small-section-label">HOW IT WORKS</span>
            {[
              {
                icon: Globe2,
                title: "Add your source",
                text: "Start with the website behind the business.",
              },
              {
                icon: ScanText,
                title: "Extract the essentials",
                text: "Your model identifies the key details.",
              },
              {
                icon: FileText,
                title: "Review and export",
                text: "Copy the text or download as Markdown.",
              },
            ].map(({ icon: Icon, title, text }, index) => (
              <div className="workflow-step" key={title}>
                <span>
                  <Icon size={16} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
                <small>0{index + 1}</small>
              </div>
            ))}
          </div>
        </div>
        <Card className="preview-panel">
          <div className="preview-toolbar">
            <span>
              <span className={`small-dot ${brochure ? "success-dot" : ""}`} />
              {brochure ? "Your brochure" : "Document preview"}
            </span>
            <Badge variant="outline">
              {isLoading
                ? "IN PROGRESS"
                : brochure
                  ? "READY TO SHARE"
                  : "PREVIEW"}
            </Badge>
          </div>
          {isLoading ? (
            <div className="preview-loading">
              <div className="preview-loading-icon">
                <ScanText size={30} />
              </div>
              <h3>Finding the story.</h3>
              <p>Reading the website and bringing the details together.</p>
              <Thinking text="Your brochure is taking shape…" />
              <ResponseStatus active>
                This can take a moment, depending on the model.
              </ResponseStatus>
            </div>
          ) : brochure ? (
            <Tabs defaultValue="preview" className="brochure-result">
              <div className="result-actions">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="text">Plain text</TabsTrigger>
                </TabsList>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copy brochure"
                    onClick={copyBrochure}
                  >
                    {copyStatus === "Copied to clipboard" ? (
                      <Check />
                    ) : (
                      <Copy />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBrochure}
                  >
                    <ArrowDownToLine />
                    Download
                  </Button>
                </div>
              </div>
              <TabsContent value="preview">
                <article
                  className="generated-document"
                  style={{
                    "--document-accent": getSafeColor(
                      brochure.colors?.primary_color,
                    ),
                    "--document-secondary": getSafeColor(
                      brochure.colors?.secondary_color,
                      "#d8d0ed",
                    ),
                    "--document-tertiary": getSafeColor(
                      brochure.colors?.tertiary_color,
                      "#9280bf",
                    ),
                  }}
                >
                  <div className="document-top">
                    <span>THE BUSINESS EDIT</span>
                    <Globe2 size={18} />
                  </div>
                  <span className="document-eyebrow">A CLOSER LOOK</span>
                  <h2>{brochure.heading}</h2>
                  <p className="document-description">{brochure.description}</p>
                  <Separator />
                  <h3>What sets us apart</h3>
                  <ul>
                    {brochure.bullet_points.map((point, index) => (
                      <li key={index}>
                        <Check size={15} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <blockquote>{brochure.summary}</blockquote>
                  <div className="document-bottom">
                    <span>{source}</span>
                    <span>AI STUDIO</span>
                  </div>
                </article>
              </TabsContent>
              <TabsContent value="text">
                <pre className="brochure-plain-text">
                  {toMarkdown(brochure)}
                </pre>
              </TabsContent>
              <p className="copy-status" role="status">
                {copyStatus ||
                  "Your first draft is ready. Review the details before sharing."}
              </p>
            </Tabs>
          ) : (
            <div className="preview-empty">
              <div className="document-stack" aria-hidden="true">
                <div className="document-shadow-sheet" />
                <div className="document-sample">
                  <div className="sample-header">
                    <span className="sample-logo">
                      <BrandMark />
                    </span>
                    <span>COMPANY OVERVIEW</span>
                  </div>
                  <div className="sample-kicker">YOUR NEXT INTRODUCTION</div>
                  <div className="sample-title">
                    Your business.
                    <br />
                    Clearly told.
                  </div>
                  <div className="sample-rule" />
                  <div className="sample-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="sample-benefits">
                    <span>
                      <Check size={10} />A clear point of view
                    </span>
                    <span>
                      <Check size={10} />
                      The details that matter
                    </span>
                    <span>
                      <Check size={10} />A lasting impression
                    </span>
                  </div>
                  <div className="sample-footer">
                    <span>AI STUDIO</span>
                    <span>01</span>
                  </div>
                </div>
              </div>
              <h3>Your brochure, ready for its first draft.</h3>
              <p>Add a website to generate a tailored company overview.</p>
            </div>
          )}
          <div className="preview-bottom">
            <FileText size={13} />
            <span>
              {brochure
                ? "Generated from your website"
                : "Example layout · Your content will appear here"}
            </span>
            <span className="ml-auto">01 / 01</span>
          </div>
        </Card>
      </div>
      <ToolFooter />
    </div>
  );
}
