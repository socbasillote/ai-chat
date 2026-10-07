import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { clearAuthError, clearAuthNotice, loginUser } from "../store/authSlice";

import fmesintellilogo from "../assets/fmesintellilogo.png";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isLoading, error, notice } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    dispatch(clearAuthError());
    dispatch(clearAuthNotice());

    const result = await dispatch(
      loginUser({
        email,
        password,
      }),
    );

    if (loginUser.fulfilled.match(result)) {
      navigate("/", {
        replace: true,
      });
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="flex h-8 w-36 items-center mb-10">
          <img
            src={fmesintellilogo}
            alt="Fmesintelli"
            className="h-full w-full object-contain"
          />
        </div>

        <h1
          id="auth-title"
          className="text-[30px] font-semibold tracking-tight text-zinc-900"
        >
          Welcome back
        </h1>
        <p className="mb-7 mt-2 text-sm text-zinc-500">
          Sign in to continue to your conversations.
        </p>

        <form
          className="flex flex-col gap-2"
          onSubmit={handleSubmit}
          aria-busy={isLoading}
        >
          <label
            className="mt-1 text-sm font-semibold text-zinc-700"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10"
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            required
          />

          <label
            className="mt-1 text-sm font-semibold text-zinc-700"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative">
            <input
              className="min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2.5 pr-20 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 disabled:cursor-wait disabled:bg-zinc-50"
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
            <button
              className="absolute inset-y-0 right-3 my-auto h-fit text-xs font-semibold text-zinc-700 hover:text-zinc-900 disabled:cursor-wait disabled:opacity-50"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={isLoading}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {notice && (
            <p
              className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800"
              role="status"
              aria-live="polite"
            >
              {notice}
            </p>
          )}
          {error && (
            <p
              className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <button
            className="mt-3 min-h-12 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span
                  className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            className="font-semibold text-zinc-700 hover:underline"
            to="/register"
          >
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
};
