import { env } from "../config/env.js";
import { LlamaChatRequest, LlamaMessage } from "../types/llama.js";
import { AppError } from "../utils/app-error.js";

const LLAMA_TIMEOUT_MS = 120_000;
const LLAMA_HEALTH_TIMEOUT_MS = 3_000;
const LLAMA_UNAVAILABLE_MESSAGE =
  "The AI service is temporarily unavailable. Please try again.";
const LLAMA_INFERENCE_MESSAGE =
  "The AI service could not complete your request. Please try again.";
const LLAMA_INVALID_RESPONSE_MESSAGE =
  "The AI service returned an invalid response. Please try again.";
const LLAMA_EMPTY_RESPONSE_MESSAGE =
  "The AI service returned an empty response. Please try again.";

const createLlamaError = (
  message: string,
  code:
    | "LLAMA_SERVER_UNAVAILABLE"
    | "LLAMA_INFERENCE_ERROR"
    | "LLAMA_INVALID_RESPONSE"
    | "LLAMA_EMPTY_RESPONSE"
    | "LLAMA_STREAM_INTERRUPTED",
): AppError =>
  new AppError(
    message,
    code === "LLAMA_SERVER_UNAVAILABLE" ? 503 : 502,
    code,
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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
      signal: AbortSignal.timeout(LLAMA_HEALTH_TIMEOUT_MS),
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
      LLAMA_UNAVAILABLE_MESSAGE,
      503,
      "LLAMA_SERVER_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    throw createLlamaError(
      LLAMA_INFERENCE_MESSAGE,
      "LLAMA_INFERENCE_ERROR",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw createLlamaError(
      LLAMA_INVALID_RESPONSE_MESSAGE,
      "LLAMA_INVALID_RESPONSE",
    );
  }

  if (
    !isRecord(data) ||
    !Array.isArray(data.choices) ||
    !isRecord(data.choices[0]) ||
    !isRecord(data.choices[0].message) ||
    typeof data.choices[0].message.content !== "string"
  ) {
    throw createLlamaError(
      LLAMA_INVALID_RESPONSE_MESSAGE,
      "LLAMA_INVALID_RESPONSE",
    );
  }

  const content = data.choices[0].message.content;

  if (!content?.trim()) {
    throw createLlamaError(
      LLAMA_EMPTY_RESPONSE_MESSAGE,
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
  const timeoutSignal = createTimeoutSignal();
  const requestSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

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
      signal: requestSignal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new AppError(
      LLAMA_UNAVAILABLE_MESSAGE,
      503,
      "LLAMA_SERVER_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    throw createLlamaError(
      LLAMA_INFERENCE_MESSAGE,
      "LLAMA_INFERENCE_ERROR",
    );
  }

  if (!response.body) {
    throw createLlamaError(
      LLAMA_INVALID_RESPONSE_MESSAGE,
      "LLAMA_INVALID_RESPONSE",
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let fullContent = "";
  let streamFinished = false;

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
      streamFinished = true;
      return true;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(data);
    } catch {
      throw createLlamaError(
        LLAMA_INVALID_RESPONSE_MESSAGE,
        "LLAMA_INVALID_RESPONSE",
      );
    }

    if (!isRecord(parsed) || !Array.isArray(parsed.choices)) {
      throw createLlamaError(
        LLAMA_INVALID_RESPONSE_MESSAGE,
        "LLAMA_INVALID_RESPONSE",
      );
    }

    const choice = parsed.choices[0];

    if (choice === undefined) {
      return false;
    }

    if (!isRecord(choice)) {
      throw createLlamaError(
        LLAMA_INVALID_RESPONSE_MESSAGE,
        "LLAMA_INVALID_RESPONSE",
      );
    }

    const delta = choice.delta;

    if (!isRecord(delta)) {
      if (choice.finish_reason !== null && choice.finish_reason !== undefined) {
        return false;
      }

      throw createLlamaError(
        LLAMA_INVALID_RESPONSE_MESSAGE,
        "LLAMA_INVALID_RESPONSE",
      );
    }

    const content = delta.content;

    if (content !== undefined && typeof content !== "string") {
      throw createLlamaError(
        LLAMA_INVALID_RESPONSE_MESSAGE,
        "LLAMA_INVALID_RESPONSE",
      );
    }

    if (content) {
      fullContent += content;
      onChunk(content);
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
          break;
        }
      }

      if (streamFinished) {
        break;
      }
    }

    if (!streamFinished) {
      buffer += decoder.decode();

      if (buffer.trim()) {
        processLine(buffer);
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw createLlamaError(
      timeoutSignal.aborted
        ? LLAMA_UNAVAILABLE_MESSAGE
        : "The AI response was interrupted. Please try again.",
      timeoutSignal.aborted
        ? "LLAMA_SERVER_UNAVAILABLE"
        : "LLAMA_STREAM_INTERRUPTED",
    );
  } finally {
    reader.releaseLock();
  }

  if (!streamFinished) {
    throw createLlamaError(
      "The AI response was interrupted. Please try again.",
      "LLAMA_STREAM_INTERRUPTED",
    );
  }

  if (!fullContent.trim()) {
    throw createLlamaError(
      LLAMA_EMPTY_RESPONSE_MESSAGE,
      "LLAMA_EMPTY_RESPONSE",
    );
  }

  return fullContent;
};
