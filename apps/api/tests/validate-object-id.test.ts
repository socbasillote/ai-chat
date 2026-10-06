import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

import { errorHandler } from "../src/middleware/error.middleware.js";
import { validateObjectId } from "../src/middleware/validate-object-id.middleware.js";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.get("/:id", validateObjectId, (req, res) => {
    res.json({ id: req.params.id });
  });
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));

  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("Object ID validation", () => {
  it("rejects malformed IDs with a safe client error", async () => {
    const response = await fetch(`${baseUrl}/not-an-object-id`);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "INVALID_ID",
        message: "Invalid resource ID.",
      },
    });
  });

  it("allows valid ObjectId hex strings", async () => {
    const id = "507f1f77bcf86cd799439011";
    const response = await fetch(`${baseUrl}/${id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id });
  });
});
