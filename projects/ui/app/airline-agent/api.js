const API_URL = (
  process.env.NEXT_PUBLIC_AIRLINE_AGENT_API_BASE_URL || "http://localhost:8004"
).replace(/\/+$/, "");

export async function airlineRequest(path, { body, signal, accept = "application/json" } = {}) {
  const response = await fetch(API_URL + path, {
    method: body ? "POST" : "GET",
    headers: body ? { Accept: accept, "Content-Type": "application/json" } : { Accept: accept },
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
  if (error.name === "TimeoutError") return "The airline API took too long to reply. Try again.";
  if (error instanceof TypeError) return "Could not reach the airline API. Check that FastAPI is running.";
  return error.message;
}
