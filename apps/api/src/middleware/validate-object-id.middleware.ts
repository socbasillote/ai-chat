import type { RequestHandler } from "express";
import mongoose from "mongoose";

import { AppError } from "../utils/app-error.js";

export const validateObjectId: RequestHandler = (req, _res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    next(new AppError("Invalid resource ID.", 400, "INVALID_ID"));
    return;
  }

  next();
};
