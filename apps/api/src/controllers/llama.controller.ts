import { Response } from "express";

import { AuthenticatedRequest } from "../types/auth.js";

import { generateCompletion } from "../services/llama.service.js";

import { LlamaMessage } from "../types/llama.js";

export const testLlama = async (
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const messages: LlamaMessage[] = [
    {
      role: "system",
      content: "You are a helpful AI assistant.",
    },
    {
      role: "user",
      content: "Say hello in one short sentence.",
    },
  ];

  const response = await generateCompletion(messages);

  res.status(200).json({
    success: true,
    data: {
      response,
    },
  });
};
