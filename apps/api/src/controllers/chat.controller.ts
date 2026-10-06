import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth.js";
import { createMessageSchema } from "../services/message.schemas.js";
import {
  createAssistantMessage,
  createUserMessage,
  getConversationMessagesForLlama,
} from "../services/message.service.js";
import { streamCompletion } from "../services/llama.service.js";
import { AppError } from "../utils/app-error.js";

type ConversationParams = {
  id: string;
};

const sendSse = (res: Response, event: Record<string, unknown>): void => {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
};

export const streamChat = async (
  req: AuthenticatedRequest<ConversationParams>,
  res: Response,
): Promise<void> => {
  const { id: conversationId } = req.params;

  const content = createMessageSchema.parse(req.body);

  const userId = req.user!.userId;

  const userMessage = await createUserMessage(userId, conversationId, content);

  const llamaMessages = await getConversationMessagesForLlama(
    userId,
    conversationId,
  );

  res.status(200);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();

  sendSse(res, {
    type: "start",
    message: userMessage,
  });

  const controller = new AbortController();

  let clientDisconnected = false;

  res.on("close", () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
      controller.abort();
    }
  });

  try {
    const assistantContent = await streamCompletion(
      llamaMessages,
      (chunk) => {
        sendSse(res, {
          type: "chunk",
          content: chunk,
        });
      },
      controller.signal,
    );

    const assistantMessage = await createAssistantMessage(
      conversationId,
      assistantContent,
    );

    sendSse(res, {
      type: "done",
      message: assistantMessage,
    });

    res.end();
  } catch (error) {
    if (clientDisconnected) {
      return;
    }

    if (!(error instanceof AppError)) {
      console.error("Unexpected error while streaming chat completion:", error);
    }

    sendSse(res, {
      type: "error",
      code: error instanceof AppError ? error.code : "INTERNAL_SERVER_ERROR",
      message:
        error instanceof AppError
          ? error.message
          : "The AI response could not be completed. Please try again.",
    });

    res.end();
  }
};
