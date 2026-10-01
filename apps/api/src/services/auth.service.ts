import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { generateAccessToken } from "../utils/jwt.js";
import { LoginInput, RegisterInput } from "./auth.schemas.js";

import { AppError } from "../utils/app-error.js";

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await User.findOne({
    email: input.email,
  });

  if (existingUser) {
    throw new AppError(
      "Email is already registered.",
      409,
      "EMAIL_ALREADY_REGISTERED",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  const accessToken = generateAccessToken(user._id.toString());

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    accessToken,
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({
    email: input.email,
  });

  if (!user) {
    throw new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const accessToken = generateAccessToken(user._id.toString());

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    accessToken,
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId).select(
    "_id name email createdAt updatedAt",
  );

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
