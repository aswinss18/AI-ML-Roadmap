import Image from "next/image";

const families = [
  {
    match: /^(gpt|o[134](?:-|:|$)|chatgpt)/i,
    provider: "OpenAI",
    icon: "openai.svg",
    monochrome: true,
  },
  { match: /^deepseek/i, provider: "DeepSeek", icon: "deepseek-color.svg" },
  { match: /^llama/i, provider: "Meta", icon: "meta-color.svg" },
  { match: /^gemma/i, provider: "Google", icon: "gemma-color.svg" },
  { match: /^phi/i, provider: "Microsoft", icon: "microsoft-color.svg" },
  { match: /^meditron/i, provider: "Meditron · EPFL", icon: "meditron.png" },
  { match: /^claude/i, provider: "Anthropic", icon: "claude-color.svg" },
  { match: /^qwen/i, provider: "Qwen", icon: "qwen-color.svg" },
  {
    match: /^(ministral|mistral|mixtral|devstral|codestral)/i,
    provider: "Mistral AI",
    icon: "mistral-color.svg",
  },
];
const names = {
  meditron: "Meditron",
  "deepseek-r1": "DeepSeek R1",
  "llama3.2": "Llama 3.2",
  "gpt-oss": "GPT-OSS",
  "qwen3.5": "Qwen 3.5",
  "ministral-3": "Ministral 3",
  phi3: "Phi 3",
  gemma3: "Gemma 3",
};

export function getModelIdentity(model = "") {
  const [name, tag = ""] = model.split(":");
  const family = families.find((item) => item.match.test(name));
  return {
    name: names[name] || name || "Select a model",
    tag: tag === "latest" ? "" : tag.toUpperCase(),
    detail: family
      ? `${family.provider}${tag && tag !== "latest" ? ` · ${tag.toUpperCase()}` : ""}`
      : "Local model",
    icon: family?.icon,
    monochrome: family?.monochrome,
  };
}

export function ModelIcon({ model, className = "" }) {
  const identity = getModelIdentity(model);
  if (!identity.icon)
    return (
      <span
        className={`model-provider-icon model-fallback ${className}`}
        aria-hidden="true"
      >
        {identity.name.slice(0, 1).toUpperCase()}
      </span>
    );
  return (
    <Image
      src={`/brands/${identity.icon}`}
      width={20}
      height={20}
      unoptimized
      alt=""
      aria-hidden="true"
      className={`model-provider-icon ${identity.monochrome ? "monochrome" : ""} ${className}`}
    />
  );
}
