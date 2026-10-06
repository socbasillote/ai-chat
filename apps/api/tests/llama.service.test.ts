import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { LlamaMessage } from "../src/types/llama.js";

const messages: LlamaMessage[] = [{ role: "user", content: "Hello" }];

let generateCompletion: typeof import("../src/services/llama.service.js")["generateCompletion"];
let streamCompletion: typeof import("../src/services/llama.service.js")["streamCompletion"];

const response = (body: BodyInit | null, init?: ResponseInit) =>
  new Response(body, init);

const expectAppError = async (
  promise: Promise<unknown>,
  code: string,
  message: string,
) => {
  await expect(promise).rejects.toMatchObject({
    name: "AppError",
    code,
    message,
  });
};

describe("Llama service failures", () => {
  beforeAll(async () => {
    vi.stubEnv("MONGODB_URI", "mongodb://localhost/test");
    vi.stubEnv("JWT_SECRET", "test-secret");
    vi.stubEnv("LLAMA_SERVER_URL", "http://llama.test");
    vi.stubEnv("LLAMA_MODEL", "test-model");

    ({ generateCompletion, streamCompletion } = await import(
      "../src/services/llama.service.js"
    ));
  });

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("normalizes Llama connection failures without exposing network details", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new TypeError("connect ECONNREFUSED 10.0.0.7:8080"),
    );

    await expectAppError(
      generateCompletion(messages),
      "LLAMA_SERVER_UNAVAILABLE",
      "The AI service is temporarily unavailable. Please try again.",
    );
  });

  it("hides upstream HTTP error details", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      response(
        JSON.stringify({ error: { message: "private upstream details" } }),
        { status: 500 },
      ),
    );

    await expectAppError(
      generateCompletion(messages),
      "LLAMA_INFERENCE_ERROR",
      "The AI service could not complete your request. Please try again.",
    );
  });

  it.each([
    ["invalid JSON", "not-json"],
    ["malformed shape", JSON.stringify({ choices: [{}] })],
  ])("rejects %s completion responses", async (_label, body) => {
    vi.mocked(fetch).mockResolvedValueOnce(response(body));

    await expectAppError(
      generateCompletion(messages),
      "LLAMA_INVALID_RESPONSE",
      "The AI service returned an invalid response. Please try again.",
    );
  });

  it("rejects empty completion responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      response(JSON.stringify({ choices: [{ message: { content: "  " } }] })),
    );

    await expectAppError(
      generateCompletion(messages),
      "LLAMA_EMPTY_RESPONSE",
      "The AI service returned an empty response. Please try again.",
    );
  });

  it("returns normal completion content", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      response(
        JSON.stringify({ choices: [{ message: { content: "Hello there." } }] }),
      ),
    );

    await expect(generateCompletion(messages)).resolves.toBe("Hello there.");
  });

  it("normalizes streaming HTTP failures", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      response("private upstream details", { status: 503 }),
    );

    await expectAppError(
      streamCompletion(messages, () => {}),
      "LLAMA_INFERENCE_ERROR",
      "The AI service could not complete your request. Please try again.",
    );
  });

  it("normalizes streaming connection failures", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new TypeError("connect ECONNREFUSED 10.0.0.7:8080"),
    );

    await expectAppError(
      streamCompletion(messages, () => {}),
      "LLAMA_SERVER_UNAVAILABLE",
      "The AI service is temporarily unavailable. Please try again.",
    );
  });

  it("rejects malformed streaming events", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      response('data: {"choices":[{"delta":{"content":42}}]}\n\ndata: [DONE]\n\n'),
    );

    await expectAppError(
      streamCompletion(messages, () => {}),
      "LLAMA_INVALID_RESPONSE",
      "The AI service returned an invalid response. Please try again.",
    );
  });

  it("rejects streams that end without a completion marker", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      response('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'),
    );

    await expectAppError(
      streamCompletion(messages, () => {}),
      "LLAMA_STREAM_INTERRUPTED",
      "The AI response was interrupted. Please try again.",
    );
  });

  it("normalizes mid-stream network failures", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
          ),
        );
        controller.error(new TypeError("socket reset at 10.0.0.7:8080"));
      },
    });
    vi.mocked(fetch).mockResolvedValueOnce(response(body));

    await expectAppError(
      streamCompletion(messages, () => {}),
      "LLAMA_STREAM_INTERRUPTED",
      "The AI response was interrupted. Please try again.",
    );
  });

  it("rejects empty streams", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response("data: [DONE]\n\n"));

    await expectAppError(
      streamCompletion(messages, () => {}),
      "LLAMA_EMPTY_RESPONSE",
      "The AI service returned an empty response. Please try again.",
    );
  });

  it("preserves normal streamed generation", async () => {
    const onChunk = vi.fn();
    vi.mocked(fetch).mockResolvedValueOnce(
      response(
        'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n' +
          'data: {"choices":[{"delta":{"content":"there."}}]}\n\n' +
          "data: [DONE]\n\n",
      ),
    );

    await expect(streamCompletion(messages, onChunk)).resolves.toBe(
      "Hello there.",
    );
    expect(onChunk.mock.calls).toEqual([["Hello "], ["there."]]);
  });

  it("preserves an intentional stream abort", async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException("Aborted", "AbortError");
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    await expect(streamCompletion(messages, () => {}, controller.signal)).rejects.toBe(
      abortError,
    );
  });
});
