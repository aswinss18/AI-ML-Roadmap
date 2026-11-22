export const DEFAULT_MODEL = "llama3.2:latest";

// Approximate general capability levels and relative speed for local use.
const modelProfiles = [
  { ids: ["gemma3:270m"], level: 1, speed: "Very fast" },
  { ids: ["deepseek-r1:1.5b"], level: 2, speed: "Very fast" },
  { ids: ["phi3:latest", "phi3:3.8b", "phi3:mini"], level: 3, speed: "Fast" },
  { ids: [DEFAULT_MODEL, "llama3.2:3b"], level: 4, speed: "Fast" },
  { ids: ["ministral-3:3b"], level: 5, speed: "Fast" },
  { ids: ["gpt-oss:latest", "gpt-oss:20b"], level: 6, speed: "Slower" },
  { ids: ["qwen3.5:4b"], level: 7, speed: "Moderate" },
  { ids: ["meditron:latest", "meditron:7b"], speed: "Moderate", specialty: "Medical specialist" },
];

export const AVAILABLE_MODELS = modelProfiles.map(({ ids }) => ids[0]);

const profilesById = new Map(
  modelProfiles.flatMap(({ ids, level, speed, specialty }) =>
    ids.map((id) => [id, { level, speed, specialty }]),
  ),
);

export function getModelProfile(model) {
  const id = model.toLowerCase();
  return profilesById.get(id.includes(":") ? id : `${id}:latest`);
}

export function sortModels(models) {
  return [...models].sort((first, second) => {
    const firstLevel = getModelProfile(first)?.level ?? Number.MAX_SAFE_INTEGER;
    const secondLevel = getModelProfile(second)?.level ?? Number.MAX_SAFE_INTEGER;
    return firstLevel - secondLevel || first.localeCompare(second);
  });
}

export function getDefaultModel(models) {
  const ranked = sortModels(models);
  return (
    ranked.find((model) => model.toLowerCase() === DEFAULT_MODEL) ??
    ranked.find((model) => /(?:^|\/)llama3\.2(?::3b)?$/i.test(model)) ??
    ranked.find((model) => /(?:^|\/)llama(?:[\d:-]|$)/i.test(model)) ??
    ranked.findLast((model) => getModelProfile(model)?.level) ??
    ranked.find((model) => getModelProfile(model)) ??
    ranked[0] ??
    ""
  );
}
