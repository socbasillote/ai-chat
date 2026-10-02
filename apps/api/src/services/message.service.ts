import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import { LlamaMessage } from "../types/llama.js";
import { buildLlamaHistory } from "./llama-history.service.js";

import { CreateMessageInput } from "./message.schemas.js";

import { AppError } from "../utils/app-error.js";

const verifyConversationOwnership = async (
  userId: string,
  conversationId: string,
) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
  }).lean();

  if (!conversation) {
    throw new AppError(
      "Conversation not found.",
      404,
      "CONVERSATION_NOT_FOUND",
    );
  }

  return conversation;
};

export const listMessages = async (userId: string, conversationId: string) => {
  await verifyConversationOwnership(userId, conversationId);

  const messages = await Message.find({
    conversationId,
  })
    .sort({
      createdAt: 1,
    })
    .lean();

  return messages.map((message) => ({
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  }));
};

export const createUserMessage = async (
  userId: string,
  conversationId: string,
  input: CreateMessageInput,
) => {
  await verifyConversationOwnership(userId, conversationId);

  const message = await Message.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    role: "user",
    content: input.content,
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      updatedAt: new Date(),
    },
  });

  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

export const getConversationMessagesForLlama = async (
  userId: string,
  conversationId: string,
): Promise<LlamaMessage[]> => {
  await verifyConversationOwnership(userId, conversationId);

  const messages = await Message.find({
    conversationId,
  })
    .sort({ createdAt: 1 })
    .lean();

  return buildLlamaHistory(
    messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  );
};

export const createAssistantMessage = async (
  conversationId: string,
  content: string,
) => {
  const message = await Message.create({
    conversationId,
    role: "assistant",
    content,
  });

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        updatedAt: new Date(),
      },
    },
  );

  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};
