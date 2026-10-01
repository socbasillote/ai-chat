import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",

  port: Number(process.env.PORT ?? 3000),

  mongodbUri: requiredEnv("MONGODB_URI"),

  jwtSecret: requiredEnv("JWT_SECRET"),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as NonNullable<
    SignOptions["expiresIn"]
  >,

  llamaServerUrl: requiredEnv("LLAMA_SERVER_URL"),
  llamaModel: requiredEnv("LLAMA_MODEL"),

  aiTemperature: Number(process.env.AI_TEMPERATURE ?? 0.7),
  aiMaxTokens: Number(process.env.AI_MAX_TOKENS ?? 1024),
  aiContextSize: Number(process.env.AI_CONTEXT_SIZE ?? 8192),

  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
} as const;
