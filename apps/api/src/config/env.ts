import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

type NodeEnvironment = "development" | "test" | "production";

const readRequired = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const readInteger = (
  name: string,
  defaultValue: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number => {
  const rawValue = process.env[name]?.trim();
  const value = rawValue ? Number(rawValue) : defaultValue;

  if (
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(
      `Environment variable ${name} must be an integer between ${minimum} and ${maximum}.`,
    );
  }

  return value;
};

const readNumber = (
  name: string,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number => {
  const rawValue = process.env[name]?.trim();
  const value = rawValue ? Number(rawValue) : defaultValue;

  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(
      `Environment variable ${name} must be a number between ${minimum} and ${maximum}.`,
    );
  }

  return value;
};

const readHttpUrl = (name: string, value: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL.`);
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password
  ) {
    throw new Error(
      `Environment variable ${name} must be an HTTP(S) URL without embedded credentials.`,
    );
  }

  return url.toString().replace(/\/+$/, "");
};

const readMongoUri = (): string => {
  const value = readRequired("MONGODB_URI");

  try {
    const uri = new URL(value);

    if (
      (uri.protocol !== "mongodb:" && uri.protocol !== "mongodb+srv:") ||
      !uri.hostname
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "Environment variable MONGODB_URI must be a valid MongoDB connection URI.",
    );
  }

  return value;
};

const readJwtExpiresIn = (): NonNullable<SignOptions["expiresIn"]> => {
  const value = process.env.JWT_EXPIRES_IN?.trim() || "7d";

  if (!/^[1-9]\d*(?:ms|s|m|h|d|w|y)?$/i.test(value)) {
    throw new Error(
      "Environment variable JWT_EXPIRES_IN must be a positive duration such as 15m, 7d, or 3600.",
    );
  }

  return value as NonNullable<SignOptions["expiresIn"]>;
};

const nodeEnvironment = process.env.NODE_ENV ?? "development";

if (
  nodeEnvironment !== "development" &&
  nodeEnvironment !== "test" &&
  nodeEnvironment !== "production"
) {
  throw new Error(
    "Environment variable NODE_ENV must be development, test, or production.",
  );
}

const jwtSecret = readRequired("JWT_SECRET");

if (nodeEnvironment === "production" && jwtSecret.length < 32) {
  throw new Error(
    "Environment variable JWT_SECRET must contain at least 32 characters in production.",
  );
}

const corsOrigin =
  process.env.CORS_ORIGIN?.trim() ||
  (nodeEnvironment === "production"
    ? readRequired("CORS_ORIGIN")
    : "http://localhost:5173");

let parsedCorsOrigin: URL;

try {
  parsedCorsOrigin = new URL(corsOrigin);
} catch {
  throw new Error(
    "Environment variable CORS_ORIGIN must be a valid HTTP(S) origin.",
  );
}

if (
  (parsedCorsOrigin.protocol !== "http:" &&
    parsedCorsOrigin.protocol !== "https:") ||
  parsedCorsOrigin.origin !== corsOrigin.replace(/\/+$/, "")
) {
  throw new Error(
    "Environment variable CORS_ORIGIN must be a valid HTTP(S) origin without a path.",
  );
}

export const env = {
  nodeEnv: nodeEnvironment as NodeEnvironment,
  port: readInteger("PORT", 3000, 1, 65_535),

  mongodbUri: readMongoUri(),

  jwtSecret,
  jwtExpiresIn: readJwtExpiresIn(),

  llamaServerUrl: readHttpUrl(
    "LLAMA_SERVER_URL",
    readRequired("LLAMA_SERVER_URL"),
  ),
  llamaModel: readRequired("LLAMA_MODEL"),

  aiTemperature: readNumber("AI_TEMPERATURE", 0.7, 0, 2),
  aiMaxTokens: readInteger("AI_MAX_TOKENS", 1024, 1),
  aiContextSize: readInteger("AI_CONTEXT_SIZE", 8192, 1),

  corsOrigin,
} as const;
