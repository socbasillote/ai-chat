import { env } from "../config/env.js";
import { LlamaChatRequest, LlamaMessage } from "../types/llama.js";
import { AppError } from "../utils/app-error.js";

const LLAMA_TIMEOUT_MS = 120_000;

const buildRequestBody = (messages: LlamaMessage[]): LlamaChatRequest => {
  return {
    messages,
    model: env.llamaModel,
    temperature: env.aiTemperature,
    maxTokens: env.aiMaxTokens,
    contextSize: env.aiContextSize,
  };
};

const createTimeoutSignal = (): AbortSignal => {
  return AbortSignal.timeout(LLAMA_TIMEOUT_MS);
};

export const checkLlamaHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${env.llamaServerUrl}/health`, {
      method: "GET",
      signal: createTimeoutSignal(),
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const generateCompletion = async (
  messages: LlamaMessage[],
): Promise<string> => {
  const requestBody = buildRequestBody(messages);

  let response: Response;

  try {
    response = await fetch(`${env.llamaServerUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: requestBody.model,
        messages: requestBody.messages,
        temperature: requestBody.temperature,
        max_tokens: requestBody.maxTokens,
        stream: false,
      }),
      signal: createTimeoutSignal(),
    });
  } catch {
    throw new AppError(
      "Unable to connect to the Llama inference server.",
      503,
      "LLAMA_SERVER_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    let message = "The Llama inference server returned an error.";

    try {
      const errorBody = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (errorBody.error?.message) {
        message = errorBody.error.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new AppError(message, 502, "LLAMA_INFERENCE_ERROR");
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content?.trim()) {
    throw new AppError(
      "The Llama inference server returned an empty response.",
      502,
      "LLAMA_EMPTY_RESPONSE",
    );
  }

  return content;
};

export const streamCompletion = async (
  messages: LlamaMessage[],
  onChunk: (content: string) => void,
  signal?: AbortSignal,
): Promise<string> => {
  const requestBody = buildRequestBody(messages);

  let response: Response;

  try {
    response = await fetch(`${env.llamaServerUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: requestBody.model,
        messages: requestBody.messages,
        temperature: requestBody.temperature,
        max_tokens: requestBody.maxTokens,
        stream: true,
      }),
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new AppError(
      "Unable to connect to the Llama inference server.",
      503,
      "LLAMA_SERVER_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    let message = "The Llama inference server returned an error.";

    try {
      const errorBody = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (errorBody.error?.message) {
        message = errorBody.error.message;
      }
    } catch {
      // Ignore invalid error response bodies.
    }

    throw new AppError(message, 502, "LLAMA_INFERENCE_ERROR");
  }

  if (!response.body) {
    throw new AppError(
      "The Llama inference server returned an empty stream.",
      502,
      "LLAMA_EMPTY_STREAM",
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let fullContent = "";

  const processLine = (line: string): boolean => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return false;
    }

    if (!trimmedLine.startsWith("data:")) {
      return false;
    }

    const data = trimmedLine.slice("data:".length).trim();

    if (data === "[DONE]") {
      return true;
    }

    try {
      const parsed = JSON.parse(data) as {
        choices?: Array<{
          delta?: {
            content?: string;
          };
        }>;
      };

      const content = parsed.choices?.[0]?.delta?.content;

      if (content) {
        fullContent += content;
        onChunk(content);
      }
    } catch {
      // Ignore malformed SSE data chunks.
    }

    return false;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const finished = processLine(line);

        if (finished) {
          await reader.cancel();
          return fullContent;
        }
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processLine(buffer);
    }
  } finally {
    reader.releaseLock();
  }

  if (!fullContent.trim()) {
    throw new AppError(
      "The Llama inference server returned an empty response.",
      502,
      "LLAMA_EMPTY_RESPONSE",
    );
  }

  return fullContent;
};
