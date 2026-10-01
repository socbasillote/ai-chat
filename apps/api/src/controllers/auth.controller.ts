import { Request, Response } from "express";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/auth.service.js";

import { loginSchema, registerSchema } from "../services/auth.schemas.js";

import { AuthenticatedRequest } from "../types/auth.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  const input = registerSchema.parse(req.body);

  const result = await registerUser(input);

  res.status(201).json({
    success: true,
    data: result,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const input = loginSchema.parse(req.body);

  const result = await loginUser(input);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const me = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });

    return;
  }

  const user = await getCurrentUser(req.user.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
};
