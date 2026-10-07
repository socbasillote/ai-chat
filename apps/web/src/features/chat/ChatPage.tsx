import { type FormEvent, useEffect, useRef, useState } from "react";

import {
  clearFinishedSend,
  createNewConversation,
  fetchConversations,
  fetchMessages,
  removeConversation,
  renameConversation,
  setActiveConversation,
} from "../../store/chatSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/authSlice";
import { useChat } from "../../hooks/use-chats";
import { useAutoScroll } from "../../hooks/use-auto-scroll";

import { ChatComposer } from "./components/ChatComposer";
import { ChatMessageList } from "./components/ChatMessageList";
import { ChatSidebar } from "./components/ChatSidebar";
import { ConversationDialog } from "./components/ConversationDialog";

const getLastActiveConversationKey = (accountId: string) =>
  `ai-chat:last-active-conversation:${accountId}`;

export const ChatPage = () => {
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);
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
    activeConversationId,
    error: chatError,
    titleError,
  } = useAppSelector((state) => state.chat);
  const {
    messages,
    messagesStatus,
    messagesError,
    pendingUserMessage,
    streamingMessage,
    sendStatus,
    activeSendId,
    activeSubmissionId,
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
  const canSubmit =
    sendStatus === "idle" ||
    (sendStatus === "finishing" && activeSubmissionId === null);
  const activityLabel = {
    idle: "Ready to help",
    sending: "Sending message",
    waiting: "Waiting for response",
    streaming: "Responding",
    finishing: "Response complete",
  }[sendStatus];
  const userInitials =
    user?.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") ||
    user?.email[0]?.toUpperCase() ||
    "U";

  useEffect(() => {
    void dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (
      !user?.id ||
      conversationsStatus !== "succeeded" ||
      activeConversationId ||
      isLoading
    ) {
      return;
    }

    const storageKey = getLastActiveConversationKey(user.id);
    const savedConversationId = localStorage.getItem(storageKey);

    if (savedConversationId) {
      if (
        conversations.some(
          (conversation) => conversation.id === savedConversationId,
        )
      ) {
        dispatch(setActiveConversation(savedConversationId));
        return;
      }

      localStorage.removeItem(storageKey);
    }

    if (conversations.length === 0) {
      void dispatch(createNewConversation("New conversation"));
      return;
    }

    dispatch(setActiveConversation(conversations[0].id));
  }, [
    activeConversationId,
    conversations,
    conversationsStatus,
    dispatch,
    isLoading,
    user?.id,
  ]);

  useEffect(() => {
    if (!user?.id || !activeConversationId) {
      return;
    }

    localStorage.setItem(
      getLastActiveConversationKey(user.id),
      activeConversationId,
    );
  }, [activeConversationId, user?.id]);

  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchMessages(activeConversationId));
    }
  }, [dispatch, activeConversationId]);

  useEffect(() => {
    const composer = composerRef.current;

    if (!composer) {
      return;
    }

    composer.style.height = "auto";
    const maxHeight = 192;
    composer.style.height = `${Math.min(composer.scrollHeight, maxHeight)}px`;
    composer.style.overflowY =
      composer.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    if (!isStreaming) {
      return;
    }

    const handleStreamingEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        stopGeneration();
      }
    };

    window.addEventListener("keydown", handleStreamingEscape);
    return () => window.removeEventListener("keydown", handleStreamingEscape);
  }, [isStreaming, stopGeneration]);

  useEffect(() => {
    if (sendStatus !== "finishing" || !activeSendId) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => dispatch(clearFinishedSend(activeSendId)),
      700,
    );

    return () => window.clearTimeout(timeoutId);
  }, [activeSendId, dispatch, sendStatus]);

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

  const visibleMessages = pendingUserMessage
    ? [...messages, pendingUserMessage]
    : messages;

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

    if (
      !content ||
      !activeConversationId ||
      isStreaming ||
      isLoading ||
      !canSubmit
    ) {
      return;
    }

    if (await sendMessage(activeConversationId, content)) {
      setInput("");
    }
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
          renameConversation({ conversationId: dialog.conversationId, title }),
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

      <ChatSidebar
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarOpen={setSidebarOpen}
        setSidebarCollapsed={setSidebarCollapsed}
        conversations={conversations}
        conversationsStatus={conversationsStatus}
        isStreaming={isStreaming}
        isLoading={isLoading}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onOpenConversationDialog={openConversationDialog}
        onSignOut={() => dispatch(logout())}
        activeConversationId={activeConversationId}
        user={user}
        userInitials={userInitials}
      />

      <main className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="z-10 flex h-[72px] shrink-0 items-center gap-3 border-b border-zinc-100 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-900">
              {activeConversation?.title || "AI Chat"}
            </h1>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              A clear space for your thoughts
            </p>
          </div>
          <div
            className={`ml-auto hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium sm:flex ${
              sendStatus === "idle"
                ? "border-emerald-100 bg-emerald-50/70 text-emerald-700"
                : "border-zinc-100 bg-zinc-50 text-zinc-700"
            }`}
            role="status"
            aria-live="polite"
          >
            <span
              className={`size-1.5 rounded-full ${
                sendStatus === "idle"
                  ? "bg-emerald-500"
                  : sendStatus === "finishing"
                    ? "bg-emerald-500"
                    : "animate-pulse bg-zinc-500"
              }`}
            />
            {activityLabel}
          </div>
        </header>

        <ChatMessageList
          ref={messageContainerRef}
          messagesStatus={messagesStatus}
          messagesError={messagesError}
          chatError={chatError}
          streamError={streamError}
          titleError={titleError}
          activeConversationId={activeConversationId}
          visibleMessages={visibleMessages}
          streamingMessage={streamingMessage}
          sendStatus={sendStatus}
          isStreaming={isStreaming}
          userInitials={userInitials}
          onRetryMessages={() => {
            if (activeConversationId) {
              void dispatch(fetchMessages(activeConversationId));
            }
          }}
          setInput={setInput}
        />

        <ChatComposer
          textareaRef={composerRef}
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          activeConversationId={activeConversationId}
          canSubmit={canSubmit}
          isStreaming={isStreaming}
          isLoading={isLoading}
          stopGeneration={stopGeneration}
        />
      </main>

      <ConversationDialog
        dialog={dialog}
        renameTitle={renameTitle}
        setRenameTitle={setRenameTitle}
        actionError={actionError}
        isActionLoading={isActionLoading}
        onClose={handleDialogClose}
        onSubmit={handleConversationAction}
      />
    </div>
  );
};

export default ChatPage;
