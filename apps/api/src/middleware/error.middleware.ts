import { ErrorRequestHandler } from "express";

import mongoose from "mongoose";
import { ZodError } from "zod";

import { AppError } from "../utils/app-error.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
    });

    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });

    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: "DATABASE_VALIDATION_ERROR",
        message: "Database validation failed",
      },
    });

    return;
  }

  if (
    error instanceof mongoose.Error &&
    error.name === "MongoServerError" &&
    "code" in error &&
    error.code === 11000
  ) {
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_RESOURCE",
        message: "A resource with the same value already exists",
      },
    });

    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        env.nodeEnv === "production"
          ? "An unexpected error occurred"
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred",
    },
  });
};
