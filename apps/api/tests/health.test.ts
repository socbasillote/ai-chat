import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

const checkDatabaseHealth = vi.fn<() => Promise<boolean>>();
const checkLlamaHealth = vi.fn<() => Promise<boolean>>();

vi.mock("../src/config/database.js", () => ({ checkDatabaseHealth }));
vi.mock("../src/services/llama.service.js", () => ({ checkLlamaHealth }));

let server: Server;
let healthUrl: string;

beforeAll(async () => {
  vi.stubEnv("MONGODB_URI", "mongodb://private-user:private-password@db.internal/private");
  vi.stubEnv("JWT_SECRET", "private-jwt-secret");
  vi.stubEnv("LLAMA_SERVER_URL", "http://llama.internal/private-path");
  vi.stubEnv("LLAMA_MODEL", "C:/private/model/path");

  const { default: app } = await import("../src/app.js");
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));

  const { port } = server.address() as AddressInfo;
  healthUrl = `http://127.0.0.1:${port}/api/health`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  vi.unstubAllEnvs();
});

describe("GET /api/health", () => {
  it("reports all dependencies healthy without exposing configuration", async () => {
    checkDatabaseHealth.mockResolvedValueOnce(true);
    checkLlamaHealth.mockResolvedValueOnce(true);

    const response = await fetch(healthUrl);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(JSON.parse(body)).toEqual({
      status: "ok",
      checks: {
        api: "ok",
        mongodb: "ok",
        llama: "ok",
      },
    });
    expect(body).not.toContain("private-user");
    expect(body).not.toContain("private-password");
    expect(body).not.toContain("private-jwt-secret");
    expect(body).not.toContain("llama.internal");
    expect(body).not.toContain("private/model/path");
  });

  it("rejects request bodies larger than the configured limit", async () => {
    const response = await fetch(healthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: "x".repeat(110_000) }),
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "REQUEST_TOO_LARGE",
        message: "Request body exceeds the allowed size.",
      },
    });
  });

  it("reports MongoDB unavailable and overall degraded", async () => {
    checkDatabaseHealth.mockResolvedValueOnce(false);
    checkLlamaHealth.mockResolvedValueOnce(true);

    const response = await fetch(healthUrl);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "degraded",
      checks: {
        api: "ok",
        mongodb: "unavailable",
        llama: "ok",
      },
    });
  });

  it("reports Llama unavailable and overall degraded", async () => {
    checkDatabaseHealth.mockResolvedValueOnce(true);
    checkLlamaHealth.mockResolvedValueOnce(false);

    const response = await fetch(healthUrl);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "degraded",
      checks: {
        api: "ok",
        mongodb: "ok",
        llama: "unavailable",
      },
    });
  });
});
