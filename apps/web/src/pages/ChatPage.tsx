import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createNewConversation,
  fetchConversations,
  fetchMessages,
  removeConversation,
  renameConversation,
  setActiveConversation,
} from "../store/chatSlice";
import { useChat } from "../hooks/use-chats";
import { MarkdownMessage } from "../components/MarkdownMessage";
import { MessageActions } from "../components/MessageActions";
import { useAutoScroll } from "../hooks/use-auto-scroll";
import { logout } from "../store/authSlice";

type IconName =
  | "menu"
  | "sparkle"
  | "plus"
  | "message"
  | "edit"
  | "trash"
  | "more"
  | "chevron"
  | "send"
  | "stop"
  | "close";

const Icon = ({
  name,
  className = "size-4",
}: {
  name: IconName;
  className?: string;
}) => {
  const paths: Record<IconName, string> = {
    menu: "M4 6h16M4 12h16M4 18h16",
    sparkle: "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z",
    plus: "M12 5v14M5 12h14",
    message: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z",
    edit: "m12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z",
    trash: "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6",
    more: "M12 5h.01M12 12h.01M12 19h.01",
    chevron: "m7 10 5 5 5-5",
    send: "m22 2-7 20-4-9-9-4Zm0 0L11 13",
    stop: "M7 7h10v10H7z",
    close: "m18 6-12 12M6 6l12 12",
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
};

export const ChatPage = () => {
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [openMenuConversationId, setOpenMenuConversationId] = useState<
    string | null
  >(null);
  const [dialog, setDialog] = useState<{
    type: "rename" | "delete";
    conversationId: string;
    title: string;
  } | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const {
    conversations,
    conversationsStatus,
    conversationsError,
    activeConversationId,
    error: chatError,
    titleError,
  } = useAppSelector((state) => state.chat);
  const {
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error: streamError,
    sendMessage,
    stopGeneration,
  } = useChat();

  const messageContainerRef = useAutoScroll([messages, streamingMessage]);
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const userInitials =
    user?.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || user?.email[0]?.toUpperCase() || "U";

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchMessages(activeConversationId));
    }
  }, [dispatch, activeConversationId]);

  useEffect(() => {
    if (!dialog && !openMenuConversationId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialog(null);
        setOpenMenuConversationId(null);
        setActionError(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [dialog, openMenuConversationId]);

  const handleSelectConversation = (conversationId: string) => {
    if (isStreaming) return;

    setOpenMenuConversationId(null);
    dispatch(setActiveConversation(conversationId));
    setSidebarOpen(false);
  };

  const handleNewConversation = async () => {
    if (isStreaming) return;

    setOpenMenuConversationId(null);
    const result = await dispatch(createNewConversation("New conversation"));

    if (createNewConversation.fulfilled.match(result)) {
      setSidebarOpen(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();

    if (!content || !activeConversationId || isStreaming) return;

    setInput("");
    await sendMessage(activeConversationId, content);
  };

  const openConversationDialog = (
    type: "rename" | "delete",
    conversationId: string,
    title: string,
  ) => {
    setOpenMenuConversationId(null);
    setActionError(null);
    setDialog({ type, conversationId, title });
    setRenameTitle(title);
  };

  const handleDialogClose = () => {
    if (isActionLoading) return;
    setDialog(null);
    setActionError(null);
  };

  const handleConversationAction = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!dialog || isActionLoading) return;

    setActionError(null);
    setIsActionLoading(true);

    try {
      if (dialog.type === "rename") {
        const title = renameTitle.trim();
        if (!title) {
          setActionError("Enter a conversation title.");
          return;
        }

        const result = await dispatch(
          renameConversation({
            conversationId: dialog.conversationId,
            title,
          }),
        );

        if (renameConversation.fulfilled.match(result)) {
          setDialog(null);
        } else {
          setActionError(
            result.payload?.message ?? "Unable to rename conversation.",
          );
        }
      } else {
        const result = await dispatch(
          removeConversation(dialog.conversationId),
        );

        if (removeConversation.fulfilled.match(result)) {
          setDialog(null);
        } else {
          setActionError(
            result.payload?.message ?? "Unable to delete conversation.",
          );
        }
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex h-dvh min-h-[520px] overflow-hidden bg-white text-zinc-900">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-zinc-950/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close conversations menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[292px] shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Conversations"
      >
        <div className="flex h-[72px] items-center justify-between border-b border-zinc-200/80 px-5">
          <Link
            to="/"
            className="flex items-center gap-3 text-zinc-900 no-underline"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-violet-300 shadow-sm">
              <Icon name="sparkle" className="size-[18px]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              AI <span className="text-violet-600">Chat</span>
            </span>
          </Link>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close conversations"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="px-4 pb-4 pt-5">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleNewConversation}
            disabled={isStreaming || isLoading}
          >
            <Icon name="plus" />
            New conversation
          </button>
        </div>

        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Recent
          </h2>
          <span className="text-xs tabular-nums text-zinc-400">
            {conversationsStatus === "succeeded" ? conversations.length : "—"}
          </span>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {conversationsStatus === "loading" ||
          conversationsStatus === "idle" ? (
            <ul
              className="space-y-2 px-1 pt-2"
              aria-label="Loading conversations"
              aria-busy="true"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <li
                  key={index}
                  className="flex h-10 items-center gap-2.5 rounded-xl px-2"
                >
                  <span className="size-4 shrink-0 animate-pulse rounded bg-zinc-200" />
                  <span
                    className={`h-3 animate-pulse rounded bg-zinc-200 ${
                      index % 2 === 0 ? "w-3/4" : "w-1/2"
                    }`}
                  />
                </li>
              ))}
            </ul>
          ) : conversationsStatus === "failed" ? (
            <div
              className="mx-1 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-center"
              role="alert"
            >
              <p className="text-xs font-medium text-rose-800">
                Conversations are unavailable
              </p>
              <p className="mt-1 break-words text-[11px] leading-4 text-rose-700">
                {conversationsError || "Unable to load conversations."}
              </p>
              <button
                type="button"
                className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 focus-visible:outline-rose-600"
                onClick={() => void dispatch(fetchConversations())}
              >
                Try again
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="mx-2 mt-3 rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center">
              <p className="text-xs leading-5 text-zinc-500">
                Your conversations will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conversation) => {
                const active = conversation.id === activeConversationId;

                return (
                  <li
                    key={conversation.id}
                    className={`group flex items-center gap-1 rounded-xl px-1 transition ${
                      active
                        ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                        : "text-zinc-600 hover:bg-zinc-200/70"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      disabled={isStreaming}
                      className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5 pl-2 text-left text-[13px] disabled:cursor-not-allowed"
                      aria-current={active ? "page" : undefined}
                      title={conversation.title}
                    >
                      <Icon
                        name="message"
                        className={`size-4 shrink-0 ${
                          active ? "text-violet-600" : "text-zinc-400"
                        }`}
                      />
                      <span className="truncate">{conversation.title}</span>
                    </button>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-800 focus-visible:outline-violet-500 disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        onClick={() =>
                          setOpenMenuConversationId((current) =>
                            current === conversation.id
                              ? null
                              : conversation.id,
                          )
                        }
                        disabled={isStreaming}
                        title="Conversation actions"
                        aria-label={`Actions for ${conversation.title}`}
                        aria-haspopup="menu"
                        aria-expanded={
                          openMenuConversationId === conversation.id
                        }
                      >
                        <Icon name="more" className="size-4" />
                      </button>
                      {openMenuConversationId === conversation.id && (
                        <div
                          className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg shadow-zinc-950/10"
                          role="menu"
                          aria-label={`Actions for ${conversation.title}`}
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                            role="menuitem"
                            onClick={() =>
                              openConversationDialog(
                                "rename",
                                conversation.id,
                                conversation.title,
                              )
                            }
                          >
                            <Icon name="edit" className="size-3.5" />
                            Rename
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                            role="menuitem"
                            onClick={() =>
                              openConversationDialog(
                                "delete",
                                conversation.id,
                                conversation.title,
                              )
                            }
                          >
                            <Icon name="trash" className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {user && (
          <details className="group relative mt-auto border-t border-zinc-200/80 p-3">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-2 transition hover:bg-zinc-200/70 [&::-webkit-details-marker]:hidden">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                {userInitials}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13px] font-semibold text-zinc-800">
                  {user.name || "Your account"}
                </span>
                <span className="block truncate text-[11px] text-zinc-500">
                  {user.email}
                </span>
              </span>
              <Icon
                name="chevron"
                className="size-4 shrink-0 text-zinc-400 transition group-open:rotate-180"
              />
            </summary>
            <div className="absolute bottom-[calc(100%-4px)] left-3 right-3 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-950/10">
              <button
                type="button"
                className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                onClick={() => dispatch(logout())}
              >
                Sign out
              </button>
            </div>
          </details>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="z-10 flex h-[72px] shrink-0 items-center gap-3 border-b border-zinc-100 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open conversations"
          >
            <Icon name="menu" className="size-[19px]" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-900">
              {activeConversation?.title || "AI Chat"}
            </h1>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              A clear space for your thoughts
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-[11px] font-medium text-emerald-700 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Ready to help
          </div>
        </header>

        <section
          ref={messageContainerRef}
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

            {messages.length === 0 && !streamingMessage && !isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="mb-6 grid size-[68px] place-items-center rounded-[22px] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-indigo-100 text-violet-700 shadow-sm ring-1 ring-violet-100">
                  <Icon name="sparkle" className="size-8" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                  Your AI workspace
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[32px]">
                  What would you like to explore?
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                  Ask a question, work through an idea, or start with whatever
                  is on your mind.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {["Help me brainstorm", "Explain a concept", "Draft something"].map(
                    (prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        onClick={() => setInput(prompt)}
                      >
                        {prompt}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-7 pb-6 pt-2">
                {messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <article
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`grid size-8 shrink-0 place-items-center rounded-full ${
                          isUser
                            ? "bg-zinc-200 text-[10px] font-bold text-zinc-600"
                            : "bg-violet-100 text-violet-700"
                        }`}
                        aria-hidden="true"
                      >
                        {isUser ? (
                          userInitials
                        ) : (
                          <Icon name="sparkle" className="size-4" />
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
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
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
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700"
                      aria-hidden="true"
                    >
                      <Icon name="sparkle" className="size-4" />
                    </div>
                    <div className="min-w-0 max-w-[88%] pt-1 text-sm leading-7 text-zinc-700 sm:max-w-[80%]">
                      <MarkdownMessage content={streamingMessage.content} />
                      <span className="ml-0.5 inline-block h-4 w-1 animate-pulse rounded-full bg-violet-500 align-middle" />
                    </div>
                  </article>
                )}

                {isLoading && messages.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-violet-400" />
                    Loading conversation
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="shrink-0 border-t border-zinc-100 bg-white px-4 pb-4 pt-4 sm:px-6 sm:pb-6 lg:px-10">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-3xl"
            aria-label="Send a message"
          >
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.06)] transition focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-500/10">
              <textarea
                className="max-h-48 min-h-[58px] w-full resize-y bg-transparent px-4 pb-2 pt-4 text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  activeConversationId
                    ? "Message your assistant..."
                    : "Start a new conversation to begin"
                }
                disabled={!activeConversationId || isStreaming}
                rows={2}
                aria-label="Message"
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <p className="pl-1 text-[10px] text-zinc-400">
                  AI can make mistakes. Check important information.
                </p>
                {isStreaming ? (
                  <button
                    type="button"
                    className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    onClick={stopGeneration}
                  >
                    <Icon name="stop" className="size-3.5" />
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
                    disabled={
                      !activeConversationId || !input.trim() || isLoading
                    }
                    aria-label="Send message"
                    title="Send message"
                  >
                    <Icon name="send" className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </footer>
      </main>
      {dialog && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleDialogClose();
            }
          }}
        >
          <section
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20"
            role="dialog"
            aria-modal="true"
            aria-labelledby="conversation-dialog-title"
          >
            <h2
              id="conversation-dialog-title"
              className="text-lg font-semibold tracking-tight text-zinc-900"
            >
              {dialog.type === "rename"
                ? "Rename conversation"
                : "Delete conversation?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {dialog.type === "rename"
                ? "Choose a new name for this conversation."
                : `“${dialog.title}” and its messages will be permanently deleted.`}
            </p>
            <form className="mt-5" onSubmit={handleConversationAction}>
              {dialog.type === "rename" && (
                <label
                  className="block text-sm font-medium text-zinc-700"
                  htmlFor="conversation-title"
                >
                  Conversation name
                  <input
                    autoFocus
                    id="conversation-title"
                    className="mt-2 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:bg-zinc-50"
                    value={renameTitle}
                    onChange={(event) => setRenameTitle(event.target.value)}
                    maxLength={200}
                    required
                    disabled={isActionLoading}
                  />
                </label>
              )}
              {actionError && (
                <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                  {actionError}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="min-h-10 rounded-lg px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
                  onClick={handleDialogClose}
                  disabled={isActionLoading}
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`min-h-10 rounded-lg px-4 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60 ${
                    dialog.type === "delete"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-zinc-900 hover:bg-zinc-800"
                  }`}
                  disabled={
                    isActionLoading ||
                    (dialog.type === "rename" && !renameTitle.trim())
                  }
                >
                  {isActionLoading
                    ? dialog.type === "rename"
                      ? "Saving..."
                      : "Deleting..."
                    : dialog.type === "rename"
                      ? "Save"
                      : "Delete conversation"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
