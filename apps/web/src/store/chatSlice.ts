import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Conversation, Message } from "../types/chat";

import { streamChat } from "../services/chat.service";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  streamingMessage: Message | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  streamingMessage: null,
  isLoading: false,
  isStreaming: false,
  error: null,
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async () => {
    const token = getAccessToken();

    if (!token) {
      throw new Error("Authentication required.");
    }

    const response = await fetch(`${API_URL}/api/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load conversations.");
    }

    const data = await response.json();

    return data.data as Conversation[];
  },
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId: string) => {
    const token = getAccessToken();

    if (!token) {
      throw new Error("Authentication required.");
    }

    const response = await fetch(
      `${API_URL}/api/conversations/${conversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Unable to load messages.");
    }

    const data = await response.json();

    return data.data as Message[];
  },
);

export const sendChatMessage = createAsyncThunk(
  "chat/sendChatMessage",
  async (
    {
      conversationId,
      content,
      signal,
    }: {
      conversationId: string;
      content: string;
      signal: AbortSignal;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(
        startStreaming({
          conversationId,
        }),
      );

      await streamChat({
        conversationId,
        content,
        signal,

        onEvent: (event) => {
          switch (event.type) {
            case "start":
              dispatch(addMessage(event.message));
              break;

            case "chunk":
              dispatch(appendStreamingContent(event.content));
              break;

            case "done":
              dispatch(finishStreaming(event.message));
              break;

            case "error":
              dispatch(setError(event.message));
              break;
          }
        },
      });

      return true;
    } catch (error) {
      dispatch(clearStreamingMessage());
      if (signal.aborted) {
        return false;
      }

      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to send message.",
      );
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;

      state.messages = [];
      state.streamingMessage = null;
      state.error = null;
    },

    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },

    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },

    setStreamingMessage: (state, action: PayloadAction<Message | null>) => {
      state.streamingMessage = action.payload;
    },

    appendStreamingContent: (state, action: PayloadAction<string>) => {
      if (!state.streamingMessage) {
        return;
      }

      state.streamingMessage.content += action.payload;
    },

    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearChatError: (state) => {
      state.error = null;
    },

    finishStreaming: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
      state.streamingMessage = null;
      state.isStreaming = false;
    },

    startStreaming: (
      state,
      action: PayloadAction<{
        conversationId: string;
      }>,
    ) => {
      state.isStreaming = true;
      state.error = null;

      state.streamingMessage = {
        id: "streaming",
        conversationId: action.payload.conversationId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    clearStreamingMessage: (state) => {
      state.streamingMessage = null;
      state.isStreaming = false;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? "Unable to load conversations.";
      })

      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? "Unable to load messages.";
      });
  },
});

export const {
  setActiveConversation,
  setMessages,
  addMessage,
  setStreamingMessage,
  appendStreamingContent,
  setStreaming,
  setLoading,
  setError,
  clearChatError,
  startStreaming,
  finishStreaming,
  clearStreamingMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
