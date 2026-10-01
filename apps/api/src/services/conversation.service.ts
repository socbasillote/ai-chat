import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";

import {
  CreateConversationInput,
  UpdateConversationInput,
} from "./conversation.schemas.js";

import { AppError } from "../utils/app-error.js";

export const listConversations = async (userId: string) => {
  const conversations = await Conversation.find({
    userId,
  })
    .sort({
      updatedAt: -1,
    })
    .lean();

  return conversations.map((conversation) => ({
    id: conversation._id.toString(),
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  }));
};

export const createConversation = async (
  userId: string,
  input: CreateConversationInput,
) => {
  const conversation = await Conversation.create({
    userId: new mongoose.Types.ObjectId(userId),
    title: input.title,
  });

  return {
    id: conversation._id.toString(),
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

export const getConversation = async (
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

  return {
    id: conversation._id.toString(),
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

export const updateConversation = async (
  userId: string,
  conversationId: string,
  input: UpdateConversationInput,
) => {
  const conversation = await Conversation.findOneAndUpdate(
    {
      _id: conversationId,
      userId,
    },
    {
      $set: {
        title: input.title,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!conversation) {
    throw new AppError(
      "Conversation not found.",
      404,
      "CONVERSATION_NOT_FOUND",
    );
  }

  return {
    id: conversation._id.toString(),
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

export const deleteConversation = async (
  userId: string,
  conversationId: string,
) => {
  const conversation = await Conversation.findOneAndDelete({
    _id: conversationId,
    userId,
  });

  if (!conversation) {
    throw new AppError(
      "Conversation not found.",
      404,
      "CONVERSATION_NOT_FOUND",
    );
  }
};
