import type { Conversation } from "../types/chat";
import { fetchWithSessionExpiration } from "./auth-expiration";
import { API_URL } from "../config/api";

const getAuthHeaders = (token: string): HeadersInit => {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const createConversation = async (
  title: string,
  token: string,
): Promise<Conversation> => {
  const response = await fetchWithSessionExpiration(
    `${API_URL}/api/conversations`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ title }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Unable to create conversation.");
  }

  return data.data as Conversation;
};

export const updateConversation = async (
  conversationId: string,
  title: string,
  token: string,
): Promise<Conversation> => {
  const response = await fetchWithSessionExpiration(
    `${API_URL}/api/conversations/${conversationId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ title }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Unable to update conversation.");
  }

  return data.data as Conversation;
};

export const deleteConversation = async (
  conversationId: string,
  token: string,
): Promise<void> => {
  const response = await fetchWithSessionExpiration(
    `${API_URL}/api/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(token),
    },
  );

  if (!response.ok) {
    const data = await response.json();

    throw new Error(data?.error?.message ?? "Unable to delete conversation.");
  }
};
