import { LlamaMessage } from "../types/llama.js";

import { MessageRole } from "../models/Message.js";

import { DEFAULT_SYSTEM_PROMPT } from "./llama.prompt.js";

export const buildLlamaHistory = (
  messages: Array<{
    role: MessageRole;
    content: string;
  }>,
): LlamaMessage[] => {
  return [
    {
      role: "system",
      content: DEFAULT_SYSTEM_PROMPT,
    },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
};
