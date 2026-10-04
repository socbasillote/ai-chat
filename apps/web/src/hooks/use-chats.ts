import { useCallback, useRef } from "react";

import { sendChatMessage } from "../store/chatSlice";

import { useAppDispatch, useAppSelector } from "../store/hooks";

export const useChat = () => {
  const dispatch = useAppDispatch();

  const { messages, streamingMessage, isStreaming, isLoading, error } =
    useAppSelector((state) => state.chat);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (isStreaming) {
        return;
      }

      const controller = new AbortController();

      abortControllerRef.current = controller;

      try {
        await dispatch(
          sendChatMessage({
            conversationId,
            content,
            signal: controller.signal,
          }),
        );
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [dispatch, isStreaming],
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();

    abortControllerRef.current = null;
  }, []);

  return {
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
  };
};
