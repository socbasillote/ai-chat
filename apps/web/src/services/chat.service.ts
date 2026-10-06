import type { StreamEvent } from "../types/chat";
import { fetchWithSessionExpiration } from "./auth-expiration";
import { API_URL } from "../config/api";

export const streamChat = async ({
  conversationId,
  content,
  token,
  onEvent,
  signal,
}: {
  conversationId: string;
  content: string;
  token: string;
  onEvent: (event: StreamEvent) => void;
  signal?: AbortSignal;
}): Promise<void> => {
  const response = await fetchWithSessionExpiration(
    `${API_URL}/api/conversations/${conversationId}/messages/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content,
      }),
      signal,
    },
  );

  if (!response.ok) {
    let message = "Unable to send message.";

    try {
      const data = await response.json();

      if (data?.error?.message) {
        message = data.error.message;
      }
    } catch {
      // Ignore invalid JSON error responses.
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("The server returned an empty response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const events = buffer.split("\n\n");

      buffer = events.pop() ?? "";

      for (const eventText of events) {
        processSseEvent(eventText, onEvent);
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processSseEvent(buffer, onEvent);
    }
  } finally {
    reader.releaseLock();
  }
};

const processSseEvent = (
  eventText: string,
  onEvent: (event: StreamEvent) => void,
): void => {
  const lines = eventText.split("\n");

  for (const line of lines) {
    if (!line.startsWith("data:")) {
      continue;
    }

    const data = line.slice("data:".length).trim();

    if (!data) {
      continue;
    }

    try {
      const event = JSON.parse(data) as StreamEvent;

      onEvent(event);
    } catch {
      console.error("Invalid SSE event:", data);
    }
  }
};
