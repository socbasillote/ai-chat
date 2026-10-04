import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getCurrentUser, login, register } from "../services/auth.service";

import type { User } from "../types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;
}

const accessToken = localStorage.getItem("accessToken");

const initialState: AuthState = {
  user: null,
  accessToken,
  isAuthenticated: Boolean(accessToken),
  isLoading: false,
  initialized: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await register(input);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Registration failed.",
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    input: {
      email: string;
      password: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await login(input);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed.",
      );
    }
  },
);

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      return null;
    }

    try {
      const user = await getCurrentUser(token);

      return {
        user,
        accessToken: token,
      };
    } catch {
      localStorage.removeItem("accessToken");

      return rejectWithValue("Session expired.");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("accessToken");
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;

        localStorage.setItem("accessToken", action.payload.accessToken);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Registration failed.";
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;

        localStorage.setItem("accessToken", action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Login failed.";
      })

      // Initialize existing session
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.initialized = true;

        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.initialized = true;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
