"use client";
import { AlertCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getModelIdentity, ModelIcon } from "@/components/model-identity";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const AVAILABLE_MODELS = [
  "meditron:latest",
  "deepseek-r1:1.5b",
  "llama3.2:latest",
  "gpt-oss:latest",
  "phi3:latest",
  "gemma3:270m",
];
export function ModelSelect({
  id,
  value,
  onValueChange,
  models = AVAILABLE_MODELS,
  disabled,
  loading,
  label = "AI model",
}) {
  const selected = getModelIdentity(value);
  return (
    <div className="model-field">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading || !models.length}
      >
        <SelectTrigger
          id={id}
          className="model-trigger"
          title={loading ? "Finding models…" : value || "No models available"}
          aria-busy={loading || undefined}
        >
          <SelectValue
            placeholder={loading ? "Finding models…" : "No models available"}
          >
            {loading ? (
              <span className="flex min-w-0 items-center gap-2">
                <Loader2
                  className="size-3.5 shrink-0 animate-spin"
                  aria-hidden="true"
                />
                <span className="truncate">Finding models…</span>
              </span>
            ) : value ? (
              <span className="model-selected">
                <ModelIcon model={value} />
                <span className="model-selected-name">{selected.name}</span>
                {selected.tag && (
                  <span className="model-parameter-tag">{selected.tag}</span>
                )}
              </span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          collisionPadding={16}
          className="model-catalog max-w-[calc(100vw-2rem)]"
        >
          <SelectGroup>
            <SelectLabel className="model-catalog-label">
              Choose a model
            </SelectLabel>
            {models.map((model) => {
              const identity = getModelIdentity(model);
              return (
                <SelectItem
                  className="model-option min-w-0 [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1"
                  key={model}
                  value={model}
                  textValue={`${identity.name} ${identity.detail}`}
                >
                  <span className="model-option-row min-w-0">
                    <span className="model-option-logo">
                      <ModelIcon model={model} />
                    </span>
                    <span className="model-option-copy min-w-0 [overflow-wrap:anywhere]">
                      <strong>{identity.name}</strong>
                      <small>{identity.detail}</small>
                    </span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
export function ErrorNotice({
  children,
  title = "Something needs attention",
  action,
}) {
  if (!children) return null;
  return (
    <Alert variant="destructive" className="studio-alert">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex min-w-0 flex-col items-start">
        <span className="min-w-0">{children}</span>
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </AlertDescription>
    </Alert>
  );
}
export function ResponseStatus({ active, children }) {
  return (
    <span
      className={`response-status ${active ? "is-active" : ""}`}
      role="status"
    >
      {active ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <span className="small-dot" />
      )}
      {children}
    </span>
  );
}
export function Markdown({ children }) {
  return (
    <div className="studio-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="markdown-table">
              <table>{children}</table>
            </div>
          ),
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
export function Thinking({ text = "Putting a few thoughts together…" }) {
  return (
    <div className="thinking-state" role="status">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {text}
      </span>
      <Skeleton className="h-3 w-[92%]" />
      <Skeleton className="h-3 w-[78%]" />
      <Skeleton className="h-3 w-[58%]" />
    </div>
  );
}
export function ModelBadge({ children }) {
  const identity = getModelIdentity(children);
  return (
    <Badge variant="outline" className="model-badge">
      <ModelIcon model={children} />
      {identity.name}
      {identity.tag ? ` · ${identity.tag}` : ""}
    </Badge>
  );
}
