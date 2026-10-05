import { useCallback, useEffect, useRef } from "react";

import { cancelGeneration, sendChatMessage } from "../store/chatSlice";

import { useAppDispatch, useAppSelector } from "../store/hooks";

export const useChat = () => {
  const dispatch = useAppDispatch();

  const {
    messages,
    messagesStatus,
    messagesError,
    pendingUserMessage,
    streamingMessage,
    sendStatus,
    activeSendId,
    isStreaming,
    isLoading,
    error,
  } = useAppSelector((state) => state.chat);
  const sessionVersion = useAppSelector((state) => state.chat.sessionVersion);

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSendIdRef = useRef<string | null>(null);
  const sendStatusRef = useRef(sendStatus);
  sendStatusRef.current = sendStatus;

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      activeSendIdRef.current = null;
    },
    [sessionVersion],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string): Promise<boolean> => {
      if (
        sendStatusRef.current !== "idle" ||
        (abortControllerRef.current &&
          !abortControllerRef.current.signal.aborted)
      ) {
        return false;
      }

      const controller = new AbortController();
      const sendId = crypto.randomUUID();

      abortControllerRef.current = controller;
      activeSendIdRef.current = sendId;
      sendStatusRef.current = "sending";

      const cleanup = () => {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          activeSendIdRef.current = null;
        }
      };

      void dispatch(
        sendChatMessage({
          conversationId,
          content,
          sendId,
          signal: controller.signal,
        }),
      ).then(cleanup, cleanup);

      return true;
    },
    [dispatch],
  );

  const stopGeneration = useCallback(() => {
    const controller = abortControllerRef.current;
    const sendId = activeSendIdRef.current;
    abortControllerRef.current = null;
    activeSendIdRef.current = null;
    sendStatusRef.current = "idle";

    if (sendId) {
      dispatch(cancelGeneration(sendId));
    }

    controller?.abort();
  }, [dispatch]);

  return {
    messages,
    messagesStatus,
    messagesError,
    pendingUserMessage,
    streamingMessage,
    sendStatus,
    activeSendId,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
  };
};
