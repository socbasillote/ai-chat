import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../types/auth.js";

import { verifyAccessToken } from "../utils/jwt.js";

import { AppError } from "../utils/app-error.js";

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401, "UNAUTHORIZED"));

    return;
  }

  const token = authorization.substring("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
    };

    next();
  } catch {
    next(
      new AppError(
        "Invalid or expired authentication token",
        401,
        "INVALID_TOKEN",
      ),
    );
  }
};
