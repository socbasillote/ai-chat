import type { AuthResponse, User } from "../types/auth";
import { notifyUnauthorized } from "./auth-expiration";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface RegisterInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const payload = {
    name:
      input.name ?? `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim(),
    email: input.email,
    password: input.password,
  };

  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseAuthResponse(response);
};

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseAuthResponse(response);
};

export const getCurrentUser = async (token: string): Promise<User> => {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  notifyUnauthorized(response);

  if (!response.ok) {
    throw new Error("Unable to retrieve the current user.");
  }

  const data = await response.json();

  return data.data as User;
};

const parseAuthResponse = async (response: Response): Promise<AuthResponse> => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Authentication request failed.");
  }

  return data.data as AuthResponse;
};
