"use client";
import { AlertCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getModelIdentity, ModelIcon } from "@/components/model-identity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AVAILABLE_MODELS, getModelProfile, sortModels } from "@/lib/models";

const brainFolds = [
  "M7 8c0 1.5 1.1 2.5 2.5 2.5",
  "M17 8c0 1.5-1.1 2.5-2.5 2.5",
  "M6 14c1.4-.5 2.7 0 3.4 1",
  "M18 14c-1.4-.5-2.7 0-3.4 1",
  "M9.5 18c-.9-.2-1.7.2-2.1 1",
  "M14.5 18c.9-.2 1.7.2 2.1 1",
  "M8 5.5c.9 0 1.5.5 1.8 1.2",
];

function ModelCapabilityIcon({ level }) {
  const label = level
    ? `General capability level ${level} of ${brainFolds.length}`
    : "General capability unrated";

  return (
    <svg
      className="model-capability-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <path d="M12 5C10 1.5 5.7 3 5.4 6.4 2.7 7.1 2 9.9 3.1 12c-1.4 2.3-.4 5.3 2.1 6 .7 3.5 4.8 4.2 6.8 1.1 2 3.1 6.1 2.4 6.8-1.1 2.5-.7 3.5-3.7 2.1-6 1.1-2.1.4-4.9-2.3-5.6C18.3 3 14 1.5 12 5Z" />
      <path d="M12 5v14.1" />
      {brainFolds.slice(0, level ?? 0).map((fold) => <path key={fold} d={fold} />)}
    </svg>
  );
}

export function ThinkToggle({ think, onChange, disabled }) {
  return (
    <Button
      type="button"
      role="switch"
      aria-checked={think}
      variant={think ? "secondary" : "outline"}
      disabled={disabled}
      onClick={() => onChange(!think)}
    >
      Think
      <span aria-hidden="true" className="text-xs text-muted-foreground">
        {think ? "On" : "Off"}
      </span>
    </Button>
  );
}

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
  const selectedLevel = getModelProfile(value)?.level;
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
                <ModelCapabilityIcon level={selectedLevel} />
              </span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          collisionPadding={16}
          className="model-catalog"
        >
          <SelectGroup>
            <SelectLabel className="model-catalog-label">
              <strong>General capability ranking</strong>
              <span>Lowest to highest · more folds mean higher estimated capability</span>
              <span>Speed varies with hardware and Think</span>
            </SelectLabel>
            {sortModels(models).map((model) => {
              const identity = getModelIdentity(model);
              const profile = getModelProfile(model);
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
                      <small>
                        {identity.detail}
                        {profile?.specialty && ` · ${profile.specialty}`}
                      </small>
                    </span>
                    <ModelCapabilityIcon level={profile?.level} />
                    <span className="model-option-speed">
                      {profile ? profile.speed : "Speed unknown"}
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
