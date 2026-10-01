import { Response } from "express";

import { AuthenticatedRequest } from "../types/auth.js";

import {
  createConversationSchema,
  updateConversationSchema,
} from "../services/conversation.schemas.js";

import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  updateConversation,
} from "../services/conversation.service.js";

type ConversationParams = {
  id: string;
};

export const list = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  const conversations = await listConversations(userId);

  res.status(200).json({
    success: true,
    data: conversations,
  });
};

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  const input = createConversationSchema.parse(req.body);

  const conversation = await createConversation(userId, input);

  res.status(201).json({
    success: true,
    data: conversation,
  });
};

export const getById = async (
  req: AuthenticatedRequest<ConversationParams>,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  const conversation = await getConversation(userId, req.params.id);

  res.status(200).json({
    success: true,
    data: conversation,
  });
};

export const update = async (
  req: AuthenticatedRequest<ConversationParams>,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  const input = updateConversationSchema.parse(req.body);

  const conversation = await updateConversation(userId, req.params.id, input);

  res.status(200).json({
    success: true,
    data: conversation,
  });
};

export const remove = async (
  req: AuthenticatedRequest<ConversationParams>,
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;

  await deleteConversation(userId, req.params.id);

  res.status(200).json({
    success: true,
    data: {
      message: "Conversation deleted successfully",
    },
  });
};
