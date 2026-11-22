const API_URL = (
  process.env.NEXT_PUBLIC_AIRLINE_AGENT_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export async function airlineRequest(
  path,
  { body, signal, accept = "application/json" } = {},
) {
  const response = await fetch(API_URL + path, {
    method: body ? "POST" : "GET",
    headers: body
      ? { Accept: accept, "Content-Type": "application/json" }
      : { Accept: accept },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "The airline API could not complete this request.",
    );
  }
  return response;
}

export function requestError(error) {
  if (error.name === "TimeoutError")
    return "The airline API took too long to reply. Try again.";
  if (error instanceof TypeError)
    return "Could not reach the airline API. Check that FastAPI is running.";
  return error.message;
}

export const CHAT_EVENT_FORMAT = "application/x-ndjson";

export async function* readChatEvents(response) {
  if (
    !response.body ||
    !response.headers.get("content-type")?.includes(CHAT_EVENT_FORMAT)
  ) {
    throw new Error("The airline API did not return a chat event stream.");
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const lines = (pending + value).split("\n");
      pending = lines.pop();
      for (const line of lines) {
        if (line.trim()) yield JSON.parse(line);
      }
    }
    if (pending.trim()) yield JSON.parse(pending);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
