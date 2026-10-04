import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import {
  createConversation,
  updateConversation,
  deleteConversation,
} from "../services/conversation.service";
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

export const createNewConversation = createAsyncThunk(
  "chat/createConversation",
  async (title: string, { rejectWithValue }) => {
    try {
      return await createConversation(title);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to create conversation.",
      );
    }
  },
);

export const renameConversation = createAsyncThunk(
  "chat/renameConversation",
  async (
    {
      conversationId,
      title,
    }: {
      conversationId: string;
      title: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await updateConversation(conversationId, title);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to rename conversation.",
      );
    }
  },
);

export const removeConversation = createAsyncThunk(
  "chat/deleteConversation",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      await deleteConversation(conversationId);

      return conversationId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to delete conversation.",
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
      })
      .addCase(createNewConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewConversation.fulfilled, (state, action) => {
        state.isLoading = false;

        state.conversations.unshift(action.payload);

        state.activeConversationId = action.payload.id;

        state.messages = [];
        state.streamingMessage = null;
      })
      .addCase(createNewConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) ?? "Unable to create conversation.";
      })

      .addCase(renameConversation.pending, (state) => {
        state.error = null;
      })
      .addCase(renameConversation.fulfilled, (state, action) => {
        const conversation = state.conversations.find(
          (item) => item.id === action.payload.id,
        );

        if (conversation) {
          conversation.title = action.payload.title;

          conversation.updatedAt = action.payload.updatedAt;
        }
      })
      .addCase(renameConversation.rejected, (state, action) => {
        state.error =
          (action.payload as string) ?? "Unable to rename conversation.";
      })

      .addCase(removeConversation.pending, (state) => {
        state.error = null;
      })
      .addCase(removeConversation.fulfilled, (state, action) => {
        const deletedId = action.payload;

        state.conversations = state.conversations.filter(
          (conversation) => conversation.id !== deletedId,
        );

        if (state.activeConversationId === deletedId) {
          state.activeConversationId = null;
          state.messages = [];
          state.streamingMessage = null;
        }
      })
      .addCase(removeConversation.rejected, (state, action) => {
        state.error =
          (action.payload as string) ?? "Unable to delete conversation.";
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
