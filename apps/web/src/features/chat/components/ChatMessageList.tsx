import { forwardRef } from "react";

import type { Message } from "../../../types/chat";
import { ChatIcon } from "./ChatIcon";
import { MarkdownMessage } from "../../../components/MarkdownMessage";
import { MessageActions } from "../../../components/MessageActions";
import mesintellilogo from "../../../assets/mesintellilogo.png";

type ChatMessageListProps = {
  messagesStatus: "idle" | "loading" | "succeeded" | "failed";
  messagesError: string | null;
  chatError: string | null;
  streamError: string | null;
  titleError: string | null;
  activeConversationId: string | null;
  visibleMessages: Message[];
  streamingMessage: Message | null;
  sendStatus: "idle" | "sending" | "waiting" | "streaming" | "finishing";
  isStreaming: boolean;
  userInitials: string;
  onRetryMessages: () => void;
  setInput: (value: string) => void;
};

export const ChatMessageList = forwardRef<
  HTMLElement | null,
  ChatMessageListProps
>(
  (
    {
      messagesStatus,
      messagesError,
      chatError,
      streamError,
      titleError,
      activeConversationId,
      visibleMessages,
      streamingMessage,
      sendStatus,
      isStreaming,
      userInitials,
      onRetryMessages,
      setInput,
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-6 sm:px-6 lg:px-10"
        aria-label="Conversation messages"
        aria-live="polite"
      >
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
          {chatError && !streamError && (
            <p
              className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {chatError}
            </p>
          )}
          {streamError && (
            <p
              className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {streamError}
            </p>
          )}
          {titleError && (
            <p
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              role="status"
            >
              Your message was sent, but the conversation title could not be
              updated: {titleError}
            </p>
          )}

          {messagesStatus === "loading" ? (
            <div
              className="flex-1 space-y-8 py-4"
              role="status"
              aria-live="polite"
              aria-label="Loading conversation messages"
            >
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className={`flex items-start gap-3 ${item % 2 === 0 ? "flex-row-reverse" : ""}`}
                >
                  <span className="size-8 shrink-0 animate-pulse rounded-full bg-zinc-200" />
                  <div
                    className={`w-full max-w-[75%] space-y-2 ${item % 2 === 0 ? "items-end" : ""}`}
                  >
                    <span className="block h-3 w-24 animate-pulse rounded bg-zinc-200" />
                    <span
                      className={`block h-12 animate-pulse rounded-2xl bg-zinc-100 ${item === 1 ? "w-full" : "w-4/5"}`}
                    />
                    {item === 1 && (
                      <span className="block h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
                    )}
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading conversation…</span>
            </div>
          ) : messagesStatus === "failed" && visibleMessages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                <ChatIcon name="message" className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-zinc-900">
                Couldn’t load this conversation
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                {messagesError || "Your messages are temporarily unavailable."}
              </p>
              {activeConversationId && (
                <button
                  type="button"
                  className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  onClick={onRetryMessages}
                >
                  Try again
                </button>
              )}
            </div>
          ) : visibleMessages.length === 0 &&
            !streamingMessage &&
            sendStatus === "idle" ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 grid size-[68px] place-items-center rounded-[22px] bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100 text-zinc-700 shadow-sm ring-1 ring-zinc-100">
                <img
                  src={mesintellilogo}
                  alt="Fmesintelli"
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Your AI workspace
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[32px]">
                What would you like to explore?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                Ask a question, work through an idea, or start with whatever is
                on your mind.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                  "Help me brainstorm",
                  "Explain a concept",
                  "Draft something",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-700"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="space-y-7 pb-6 pt-2"
              aria-live="polite"
              aria-busy={isStreaming}
            >
              {visibleMessages.map((message) => {
                const isUser = message.role === "user";
                const isPending = message.id.startsWith("pending-");

                return (
                  <article
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    } ${isPending ? "animate-[fade-in_180ms_ease-out] opacity-80" : ""}`}
                  >
                    <div
                      className={`grid size-8 shrink-0 place-items-center rounded-full ${
                        isUser
                          ? "bg-zinc-200 text-[10px] font-bold text-zinc-600"
                          : "bg-zinc-100 "
                      }`}
                      aria-hidden="true"
                    >
                      {isUser ? (
                        userInitials
                      ) : (
                        <img src={mesintellilogo} className="size-4" />
                      )}
                    </div>
                    <div
                      className={`min-w-0 max-w-[88%] sm:max-w-[80%] ${
                        isUser
                          ? "rounded-2xl rounded-tr-md bg-zinc-900 px-4 py-3 text-sm leading-6 text-white shadow-sm"
                          : "pt-1 text-sm leading-7 text-zinc-700"
                      }`}
                    >
                      {isUser ? (
                        <div>
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                          {isPending && (
                            <p className="mt-1.5 text-[10px] text-zinc-400">
                              Sending…
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <MarkdownMessage content={message.content} />
                          <MessageActions content={message.content} />
                        </>
                      )}
                    </div>
                  </article>
                );
              })}

              {streamingMessage && (
                <article className="flex items-start gap-3">
                  <div
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-700"
                    aria-hidden="true"
                  >
                    <ChatIcon name="sparkle" className="size-4" />
                  </div>
                  <div className="min-w-0 max-w-[88%] rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 text-sm leading-7 text-zinc-700 sm:max-w-[80%]">
                    {streamingMessage.content ? (
                      <>
                        <MarkdownMessage content={streamingMessage.content} />
                        <span className="ml-0.5 inline-block h-4 w-1 animate-pulse rounded-full bg-zinc-500 align-middle" />
                      </>
                    ) : (
                      <div
                        className="flex items-center gap-2 text-xs font-medium text-zinc-500"
                        role="status"
                        aria-live="polite"
                      >
                        <span
                          className="flex items-center gap-1"
                          aria-hidden="true"
                        >
                          <span className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.2s]" />
                          <span className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.1s]" />
                          <span className="size-1.5 animate-bounce rounded-full bg-zinc-500" />
                        </span>
                        Waiting for the first token…
                      </div>
                    )}
                  </div>
                </article>
              )}

              {sendStatus === "sending" && !streamingMessage && (
                <div
                  className="flex items-center gap-2 pl-11 text-xs font-medium text-zinc-500"
                  role="status"
                  aria-live="polite"
                >
                  <span className="size-3 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
                  Sending your message…
                </div>
              )}

              {sendStatus === "finishing" && (
                <p
                  className="pl-11 text-[11px] font-medium text-emerald-700"
                  role="status"
                >
                  Response complete
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    );
  },
);

ChatMessageList.displayName = "ChatMessageList";
