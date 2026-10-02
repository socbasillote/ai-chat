import { Response } from "express";

import { AuthenticatedRequest } from "../types/auth.js";

import { createMessageSchema } from "../services/message.schemas.js";

import {
  createUserMessage,
  listMessages,
} from "../services/message.service.js";

type ConversationParams = {
  id: string;
};

export const list = async (
  req: AuthenticatedRequest<ConversationParams>,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  const messages = await listMessages(userId, req.params.id);

  res.status(200).json({
    success: true,
    data: messages,
  });
};

export const create = async (
  req: AuthenticatedRequest<ConversationParams>,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  const input = createMessageSchema.parse(req.body);

  const message = await createUserMessage(userId, req.params.id, input);

  res.status(201).json({
    success: true,
    data: message,
  });
};
