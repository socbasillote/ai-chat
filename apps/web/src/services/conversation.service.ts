import type { Conversation } from "../types/chat";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const createConversation = async (
  title = "New conversation",
): Promise<Conversation> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Authentication required.");
  }

  const response = await fetch(`${API_URL}/api/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error("Unable to create conversation.");
  }

  const data = (await response.json()) as { data?: Conversation };

  if (!data.data?.id) {
    throw new Error("The server returned an invalid conversation.");
  }

  return data.data;
};
