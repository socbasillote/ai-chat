import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  clearAuthError,
  clearAuthNotice,
  registerUser,
} from "../store/authSlice";

import { useAppDispatch, useAppSelector } from "../store/hooks";

export const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isLoading, error, notice } = useAppSelector((state) => state.auth);

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    dispatch(clearAuthError());
    dispatch(clearAuthNotice());

    const result = await dispatch(
      registerUser({
        firstName,
        lastName,
        email,
        password,
      }),
    );

    if (registerUser.fulfilled.match(result)) {
      navigate("/", {
        replace: true,
      });
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_55%),#faf9fc] px-5 py-8 text-left text-zinc-900">
      <section
        className="w-full max-w-[420px] rounded-[18px] border border-zinc-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(31,15,45,0.08)] sm:p-9"
        aria-labelledby="auth-title"
      >
        <div
          className="mb-6 grid size-[42px] place-items-center rounded-[13px] bg-zinc-950 text-sm font-bold tracking-wide text-white"
          aria-hidden="true"
        >
          AI
        </div>
        <h1
          id="auth-title"
          className="text-[30px] font-semibold tracking-tight text-zinc-900"
        >
          Create your account
        </h1>
        <p className="mb-7 mt-2 text-sm text-zinc-500">
          Get started and keep your ideas moving.
        </p>

        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <label
            className="mt-1 text-sm font-semibold text-zinc-700"
            htmlFor="first-name"
          >
            First name
          </label>
          <input
            className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            id="first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            autoComplete="given-name"
            required
          />

          <label
            className="mt-1 text-sm font-semibold text-zinc-700"
            htmlFor="last-name"
          >
            Last name
          </label>
          <input
            className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            id="last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Last name"
            autoComplete="family-name"
            required
          />

          <label
            className="mt-1 text-sm font-semibold text-zinc-700"
            htmlFor="register-email"
          >
            Email
          </label>
          <input
            className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label
            className="mt-1 text-sm font-semibold text-zinc-700"
            htmlFor="register-password"
          >
            Password
          </label>
          <input
            className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            required
          />

          {notice && (
            <p
              className="mt-2 rounded-lg bg-violet-50 px-3 py-2.5 text-sm text-violet-800"
              role="status"
            >
              {notice}
            </p>
          )}
          {error && (
            <p
              className="mt-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="mt-3 min-h-12 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            className="font-semibold text-violet-700 hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
};
