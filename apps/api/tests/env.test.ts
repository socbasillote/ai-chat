import { beforeEach, describe, expect, it, vi } from "vitest";

const setDevelopmentEnvironment = () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/ai_chat");
  vi.stubEnv("JWT_SECRET", "development-only-secret");
  vi.stubEnv("LLAMA_SERVER_URL", "http://localhost:8080");
  vi.stubEnv("LLAMA_MODEL", "test-model");
  vi.stubEnv("CORS_ORIGIN", "http://localhost:5173");
};

beforeEach(() => {
  setDevelopmentEnvironment();
  vi.stubEnv("PORT", "");
  vi.stubEnv("AI_TEMPERATURE", "");
  vi.resetModules();
});

describe("API environment configuration", () => {
  it("loads valid development configuration and development defaults", async () => {
    const { env } = await import("../src/config/env.js");

    expect(env.nodeEnv).toBe("development");
    expect(env.port).toBe(3000);
    expect(env.aiTemperature).toBe(0.7);
    expect(env.mongodbUri).toBe("mongodb://localhost:27017/ai_chat");
    expect(env.llamaServerUrl).toBe("http://localhost:8080");
  });

  it("fails clearly when a required API variable is missing", async () => {
    setDevelopmentEnvironment();
    vi.stubEnv("MONGODB_URI", "");
    vi.resetModules();

    await expect(import("../src/config/env.js")).rejects.toThrow(
      "Missing required environment variable: MONGODB_URI",
    );
  });

  it("requires a strong JWT secret and explicit CORS origin in production", async () => {
    setDevelopmentEnvironment();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "too-short");
    vi.stubEnv("CORS_ORIGIN", "");
    vi.resetModules();

    await expect(import("../src/config/env.js")).rejects.toThrow(
      "JWT_SECRET must contain at least 32 characters in production.",
    );

    vi.stubEnv("JWT_SECRET", "a-long-random-production-secret-value");
    vi.resetModules();

    await expect(import("../src/config/env.js")).rejects.toThrow(
      "Missing required environment variable: CORS_ORIGIN",
    );
  });

  it("rejects invalid numeric configuration", async () => {
    setDevelopmentEnvironment();
    vi.stubEnv("PORT", "not-a-port");
    vi.resetModules();

    await expect(import("../src/config/env.js")).rejects.toThrow(
      "Environment variable PORT must be an integer",
    );
  });

  it("rejects invalid JWT expiration durations", async () => {
    vi.stubEnv("JWT_EXPIRES_IN", "0");
    vi.resetModules();

    await expect(import("../src/config/env.js")).rejects.toThrow(
      "JWT_EXPIRES_IN must be a positive duration",
    );
  });
});
