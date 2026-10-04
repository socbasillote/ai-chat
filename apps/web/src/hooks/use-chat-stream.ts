import { useCallback, useRef, useState } from "react";
import { streamChat } from "../services/chat.service";
import type { Message, StreamEvent } from "../types/chat";

interface UseChatStreamResult {
  isStreaming: boolean;
  streamingMessage: Message | null;
  error: string | null;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  stopGeneration: () => void;
  clearError: () => void;
}

export const useChatStream = (): UseChatStreamResult => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (conversationId: string, content: string): Promise<void> => {
      if (isStreaming || !conversationId?.trim()) {
        return;
      }

      setError(null);
      setStreamingMessage(null);
      setIsStreaming(true);

      const controller = new AbortController();

      abortControllerRef.current = controller;

      try {
        await streamChat({
          conversationId,
          content,
          signal: controller.signal,

          onEvent: (event: StreamEvent) => {
            switch (event.type) {
              case "start":
                setStreamingMessage({
                  id: event.message.id,
                  conversationId: event.message.conversationId,
                  role: event.message.role,
                  content: "",
                  createdAt: event.message.createdAt,
                  updatedAt: event.message.updatedAt,
                });
                break;

              case "chunk":
                setStreamingMessage((current) => {
                  if (!current) {
                    return {
                      id: "streaming",
                      conversationId,
                      role: "assistant",
                      content: event.content,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                  }

                  return {
                    ...current,
                    content: current.content + event.content,
                  };
                });
                break;

              case "done":
                setStreamingMessage((current) => {
                  if (!current) {
                    return event.message;
                  }

                  return {
                    ...event.message,
                    content: current.content || event.message.content,
                  };
                });
                break;

              case "error":
                setError(event.message);
                break;
            }
          },
        });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Unable to send message.",
        );
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }

        setIsStreaming(false);
      }
    },
    [isStreaming],
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();

    abortControllerRef.current = null;

    setIsStreaming(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isStreaming,
    streamingMessage,
    error,
    sendMessage,
    stopGeneration,
    clearError,
  };
};
