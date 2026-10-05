import type { Conversation } from "../types/chat";
import { notifyUnauthorized } from "./auth-expiration";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Authentication required.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const createConversation = async (
  title: string,
): Promise<Conversation> => {
  const response = await fetch(`${API_URL}/api/conversations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });

  notifyUnauthorized(response);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Unable to create conversation.");
  }

  return data.data as Conversation;
};

export const updateConversation = async (
  conversationId: string,
  title: string,
): Promise<Conversation> => {
  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    },
  );

  notifyUnauthorized(response);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Unable to update conversation.");
  }

  return data.data as Conversation;
};

export const deleteConversation = async (
  conversationId: string,
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  notifyUnauthorized(response);

  if (!response.ok) {
    const data = await response.json();

    throw new Error(data?.error?.message ?? "Unable to delete conversation.");
  }
};
