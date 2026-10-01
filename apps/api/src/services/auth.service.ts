import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { generateAccessToken } from "../utils/jwt.js";
import { LoginInput, RegisterInput } from "./auth.schemas.js";

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await User.findOne({
    email: input.email,
  });

  if (existingUser) {
    const error = new Error("Email is already registered.");
    error.name = "ConflictError";
    throw error;
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
    const error = new Error("Invalid email or password.");
    error.name = "AuthenticationError";
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password.");
    error.name = "AuthenticationError";
    throw error;
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
    const error = new Error("User not found.");
    error.name = "NotFoundError";
    throw error;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
