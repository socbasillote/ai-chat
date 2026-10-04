import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { generateAccessToken } from "../utils/jwt.js";
import { LoginInput, RegisterInput } from "./auth.schemas.js";

import { AppError } from "../utils/app-error.js";

const resolveName = (input: RegisterInput): string => {
  return (
    input.name ?? `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim()
  ).trim();
};

const mapUser = (user: {
  _id: { toString: () => string };
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}) => {
  const [firstName, ...lastNameParts] = user.name.trim().split(/\s+/);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    firstName: firstName ?? "",
    lastName: lastNameParts.join(" "),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

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

  const name = resolveName(input);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    name,
    email: input.email,
    passwordHash,
  });

  const accessToken = generateAccessToken(user._id.toString());

  return {
    user: mapUser(user),
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
    user: mapUser(user),
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

  return mapUser(user);
};
