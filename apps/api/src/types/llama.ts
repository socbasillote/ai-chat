export type LlamaMessageRole = "system" | "user" | "assistant";

export interface LlamaMessage {
  role: LlamaMessageRole;
  content: string;
}

export interface LlamaChatRequest {
  messages: LlamaMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  contextSize: number;
}

export interface LlamaStreamChunk {
  content: string;
}
