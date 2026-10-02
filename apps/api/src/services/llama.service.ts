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
