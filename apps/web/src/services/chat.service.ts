import type { StreamEvent } from "../types/chat";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const getAccessToken = (): string | null => {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWJmMTRiOWMzZjMzYjIyOGFiNzg4NzAiLCJpYXQiOjE3OTEwMjIyMDEsImV4cCI6MTc5MTYyNzAwMX0.HFrR4c9uWRUH4NuLPqAy9eqZxvVeVHUYe7XXA9osDxA";
};

export const streamChat = async ({
  conversationId,
  content,
  onEvent,
  signal,
}: {
  conversationId: string;
  content: string;
  onEvent: (event: StreamEvent) => void;
  signal?: AbortSignal;
}): Promise<void> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Authentication required.");
  }

  const response = await fetch(
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
