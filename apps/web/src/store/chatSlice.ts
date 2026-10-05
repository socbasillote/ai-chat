import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "./store";

import {
  createConversation,
  updateConversation,
  deleteConversation,
} from "../services/conversation.service";
import type { Conversation, Message } from "../types/chat";

import { streamChat } from "../services/chat.service";
import { fetchWithSessionExpiration } from "../services/auth-expiration";
import {
  initializeAuth,
  loginUser,
  logout,
  registerUser,
  sessionExpired,
} from "./authSlice";

interface ChatState {
  accountId: string | null;
  sessionVersion: number;
  conversationRevision: number;
  autoTitleConversationIds: string[];
  conversations: Conversation[];
  conversationsStatus: "idle" | "loading" | "succeeded" | "failed";
  conversationsError: string | null;
  activeConversationId: string | null;
  messages: Message[];
  streamingMessage: Message | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  titleError: string | null;
}

const initialState: ChatState = {
  accountId: null,
  sessionVersion: 0,
  conversationRevision: 0,
  autoTitleConversationIds: [],
  conversations: [],
  conversationsStatus: "idle",
  conversationsError: null,
  activeConversationId: null,
  messages: [],
  streamingMessage: null,
  isLoading: false,
  isStreaming: false,
  error: null,
  titleError: null,
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const INITIAL_CONVERSATION_TITLE = "New conversation";
const MAX_CONVERSATION_TITLE_LENGTH = 60;

const createConversationTitle = (content: string): string => {
  const title = content.replace(/\s+/g, " ").trim();

  if (title.length <= MAX_CONVERSATION_TITLE_LENGTH) {
    return title;
  }

  return `${title.slice(0, MAX_CONVERSATION_TITLE_LENGTH - 1).trimEnd()}…`;
};

interface SessionResult<T> {
  accountId: string;
  sessionVersion: number;
  data: T;
}

interface ConversationListResult extends SessionResult<Conversation[]> {
  conversationRevision: number;
}

interface SessionError {
  accountId: string | null;
  sessionVersion: number;
  conversationRevision?: number;
  message: string;
}

type ChatThunkConfig = {
  state: RootState;
  rejectValue: SessionError;
};

const getSession = (state: RootState) => ({
  accountId: state.auth.user?.id ?? null,
  sessionVersion: state.chat.sessionVersion,
  token: state.auth.accessToken,
});

const resetForSession = (
  state: ChatState,
  accountId: string | null,
): ChatState => ({
  ...initialState,
  accountId,
  sessionVersion: state.sessionVersion + 1,
});

export const fetchConversations = createAsyncThunk<
  ConversationListResult,
  void,
  ChatThunkConfig
>(
  "chat/fetchConversations",
  async (_, { getState, rejectWithValue }) => {
    const session = getSession(getState());
    const { accountId, sessionVersion, token } = session;
    const { conversationRevision } = getState().chat;

    if (!accountId || !token) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        conversationRevision,
        message: "Authentication required.",
      });
    }

    try {
      const response = await fetchWithSessionExpiration(
        `${API_URL}/api/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load conversations.");
      }

      const data = await response.json();

      return {
        accountId,
        sessionVersion,
        conversationRevision,
        data: data.data as Conversation[],
      };
    } catch (error) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        conversationRevision,
        message:
          error instanceof Error ? error.message : "Unable to load conversations.",
      });
    }
  },
);

export const fetchMessages = createAsyncThunk<
  SessionResult<Message[]>,
  string,
  ChatThunkConfig
>(
  "chat/fetchMessages",
  async (conversationId, { getState, rejectWithValue }) => {
    const session = getSession(getState());
    const { accountId, sessionVersion, token } = session;

    if (!accountId || !token) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        message: "Authentication required.",
      });
    }

    try {
      const response = await fetchWithSessionExpiration(
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

      return {
        accountId,
        sessionVersion,
        data: data.data as Message[],
      };
    } catch (error) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        message:
          error instanceof Error ? error.message : "Unable to load messages.",
      });
    }
  },
);

export const sendChatMessage = createAsyncThunk<
  boolean,
  {
    conversationId: string;
    content: string;
    signal: AbortSignal;
  },
  ChatThunkConfig
>(
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
    { dispatch, getState, rejectWithValue },
  ) => {
    const { accountId, sessionVersion, token } = getSession(getState());

    if (!accountId || !token) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        message: "Authentication required.",
      });
    }

    try {
      let completed = false;

      dispatch(
        startStreaming({
          conversationId,
        }),
      );

      await streamChat({
        conversationId,
        content,
        token,
        signal,

        onEvent: (event) => {
          const currentSession = getSession(getState());

          if (
            currentSession.accountId !== accountId ||
            currentSession.sessionVersion !== sessionVersion
          ) {
            return;
          }

          switch (event.type) {
            case "start":
              dispatch(addMessage(event.message));
              break;

            case "chunk":
              dispatch(appendStreamingContent(event.content));
              break;

            case "done":
              completed = true;
              dispatch(finishStreaming(event.message));
              break;

            case "error":
              dispatch(setError(event.message));
              break;
          }
        },
      });

      const currentState = getState();

      if (
        completed &&
        currentState.auth.user?.id === accountId &&
        currentState.chat.sessionVersion === sessionVersion &&
        currentState.chat.autoTitleConversationIds.includes(conversationId) &&
        currentState.chat.conversations.some(
          (conversation) =>
            conversation.id === conversationId &&
            conversation.title === INITIAL_CONVERSATION_TITLE,
        )
      ) {
        void dispatch(
          autoTitleConversation({
            conversationId,
            title: createConversationTitle(content),
          }),
        );
      }

      return true;
    } catch (error) {
      const currentSession = getSession(getState());

      if (
        currentSession.accountId === accountId &&
        currentSession.sessionVersion === sessionVersion
      ) {
        dispatch(clearStreamingMessage());
      }

      if (signal.aborted) {
        return false;
      }

      return rejectWithValue(
        {
          accountId,
          sessionVersion,
          message:
            error instanceof Error ? error.message : "Unable to send message.",
        },
      );
    }
  },
);

export const autoTitleConversation = createAsyncThunk<
  SessionResult<Conversation>,
  {
    conversationId: string;
    title: string;
  },
  ChatThunkConfig
>(
  "chat/autoTitleConversation",
  async ({ conversationId, title }, { getState, rejectWithValue }) => {
    const { accountId, sessionVersion, token } = getSession(getState());

    if (!accountId || !token) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        message: "Authentication required.",
      });
    }

    try {
      return {
        accountId,
        sessionVersion,
        data: await updateConversation(conversationId, title, token),
      };
    } catch (error) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update the conversation title.",
      });
    }
  },
  {
    condition: ({ conversationId }, { getState }) => {
      const { chat } = getState();

      return (
        chat.autoTitleConversationIds.includes(conversationId) &&
        chat.conversations.some(
          (conversation) =>
            conversation.id === conversationId &&
            conversation.title === INITIAL_CONVERSATION_TITLE,
        )
      );
    },
  },
);

export const createNewConversation = createAsyncThunk<
  SessionResult<Conversation>,
  string,
  ChatThunkConfig
>(
  "chat/createConversation",
  async (title, { getState, rejectWithValue }) => {
    const { accountId, sessionVersion, token } = getSession(getState());

    if (!accountId || !token) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        message: "Authentication required.",
      });
    }

    try {
      return {
        accountId,
        sessionVersion,
        data: await createConversation(title, token),
      };
    } catch (error) {
      return rejectWithValue(
        {
          accountId,
          sessionVersion,
          message:
            error instanceof Error
              ? error.message
              : "Unable to create conversation.",
        },
      );
    }
  },
);

export const renameConversation = createAsyncThunk<
  SessionResult<Conversation>,
  {
    conversationId: string;
    title: string;
  },
  ChatThunkConfig
>(
  "chat/renameConversation",
  async (
    {
      conversationId,
      title,
    }: {
      conversationId: string;
      title: string;
    },
    { getState, rejectWithValue },
  ) => {
    const { accountId, sessionVersion, token } = getSession(getState());

    if (!accountId || !token) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        message: "Authentication required.",
      });
    }

    try {
      return {
        accountId,
        sessionVersion,
        data: await updateConversation(conversationId, title, token),
      };
    } catch (error) {
      return rejectWithValue(
        {
          accountId,
          sessionVersion,
          message:
            error instanceof Error
              ? error.message
              : "Unable to rename conversation.",
        },
      );
    }
  },
);

export const removeConversation = createAsyncThunk<
  SessionResult<string>,
  string,
  ChatThunkConfig
>(
  "chat/deleteConversation",
  async (conversationId, { getState, rejectWithValue }) => {
    const { accountId, sessionVersion, token } = getSession(getState());

    if (!accountId || !token) {
      return rejectWithValue({
        accountId,
        sessionVersion,
        message: "Authentication required.",
      });
    }

    try {
      await deleteConversation(conversationId, token);

      return {
        accountId,
        sessionVersion,
        data: conversationId,
      };
    } catch (error) {
      return rejectWithValue(
        {
          accountId,
          sessionVersion,
          message:
            error instanceof Error
              ? error.message
              : "Unable to delete conversation.",
        },
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
      state.titleError = null;
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
      .addCase(logout, (state) => resetForSession(state, null))
      .addCase(sessionExpired, (state) => resetForSession(state, null))
      .addCase(registerUser.fulfilled, (state, action) =>
        resetForSession(state, action.payload.user.id),
      )
      .addCase(loginUser.fulfilled, (state, action) =>
        resetForSession(state, action.payload.user.id),
      )
      .addCase(initializeAuth.fulfilled, (state, action) =>
        resetForSession(state, action.payload?.user.id ?? null),
      )
      .addCase(initializeAuth.rejected, (state) => resetForSession(state, null))
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsStatus = "loading";
        state.conversationsError = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        if (
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion
        ) {
          return;
        }

        if (state.conversationRevision === action.payload.conversationRevision) {
          state.conversations = action.payload.data;
        }
        state.conversationsStatus = "succeeded";
        state.conversationsError = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        if (
          !action.payload ||
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion ||
          state.conversationRevision !== action.payload.conversationRevision
        ) {
          return;
        }

        state.conversationsStatus = "failed";
        state.conversationsError = action.payload.message;
      })

      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        if (
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion ||
          state.activeConversationId !== action.meta.arg
        ) {
          return;
        }

        state.isLoading = false;
        state.messages = action.payload.data;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        if (
          !action.payload ||
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion
        ) {
          return;
        }

        state.isLoading = false;
        state.error = action.payload.message;
      })
      .addCase(createNewConversation.pending, (state) => {
        state.conversationRevision += 1;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewConversation.fulfilled, (state, action) => {
        if (
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion
        ) {
          return;
        }

        state.conversationRevision += 1;
        state.isLoading = false;
        state.conversationsStatus = "succeeded";
        state.conversationsError = null;

        state.conversations.unshift(action.payload.data);
        if (action.meta.arg === INITIAL_CONVERSATION_TITLE) {
          state.autoTitleConversationIds.push(action.payload.data.id);
        }

        state.activeConversationId = action.payload.data.id;

        state.messages = [];
        state.streamingMessage = null;
      })
      .addCase(createNewConversation.rejected, (state, action) => {
        if (
          !action.payload ||
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion
        ) {
          return;
        }

        state.isLoading = false;
        state.error = action.payload.message;
      })

      .addCase(autoTitleConversation.pending, (state, action) => {
        state.conversationRevision += 1;
        state.autoTitleConversationIds =
          state.autoTitleConversationIds.filter(
            (id) => id !== action.meta.arg.conversationId,
          );
        state.titleError = null;
      })
      .addCase(autoTitleConversation.fulfilled, (state, action) => {
        if (
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion
        ) {
          return;
        }

        const conversation = state.conversations.find(
          (item) => item.id === action.payload.data.id,
        );

        if (
          conversation &&
          conversation.title === INITIAL_CONVERSATION_TITLE
        ) {
          state.conversationRevision += 1;
          conversation.title = action.payload.data.title;
          conversation.updatedAt = action.payload.data.updatedAt;
        }

        state.titleError = null;
      })
      .addCase(autoTitleConversation.rejected, (state, action) => {
        if (
          action.payload &&
          state.accountId === action.payload.accountId &&
          state.sessionVersion === action.payload.sessionVersion
        ) {
          state.titleError = action.payload.message;
        }
      })
      .addCase(renameConversation.pending, (state, action) => {
        state.conversationRevision += 1;
        state.error = null;
        state.titleError = null;
        state.autoTitleConversationIds =
          state.autoTitleConversationIds.filter(
            (id) => id !== action.meta.arg.conversationId,
          );
      })
      .addCase(renameConversation.fulfilled, (state, action) => {
        if (
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion
        ) {
          return;
        }

        const conversation = state.conversations.find(
          (item) => item.id === action.payload.data.id,
        );

        if (conversation) {
          state.conversationRevision += 1;
          conversation.title = action.payload.data.title;

          conversation.updatedAt = action.payload.data.updatedAt;
        }

        state.autoTitleConversationIds =
          state.autoTitleConversationIds.filter(
            (id) => id !== action.payload.data.id,
          );
        state.titleError = null;
      })
      .addCase(renameConversation.rejected, (state, action) => {
        if (
          action.payload &&
          state.accountId === action.payload.accountId &&
          state.sessionVersion === action.payload.sessionVersion
        ) {
          state.error = action.payload.message;
        }
      })

      .addCase(removeConversation.pending, (state) => {
        state.conversationRevision += 1;
        state.error = null;
      })
      .addCase(removeConversation.fulfilled, (state, action) => {
        if (
          state.accountId !== action.payload.accountId ||
          state.sessionVersion !== action.payload.sessionVersion
        ) {
          return;
        }

        const deletedId = action.payload.data;

        state.conversationRevision += 1;
        state.conversations = state.conversations.filter(
          (conversation) => conversation.id !== deletedId,
        );
        state.autoTitleConversationIds =
          state.autoTitleConversationIds.filter((id) => id !== deletedId);

        if (state.activeConversationId === deletedId) {
          state.activeConversationId = null;
          state.messages = [];
          state.streamingMessage = null;
        }
      })
      .addCase(removeConversation.rejected, (state, action) => {
        if (
          action.payload &&
          state.accountId === action.payload.accountId &&
          state.sessionVersion === action.payload.sessionVersion
        ) {
          state.error = action.payload.message;
        }
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
