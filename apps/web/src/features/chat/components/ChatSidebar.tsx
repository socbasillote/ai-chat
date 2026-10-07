import { Link } from "react-router-dom";

import type { Conversation } from "../../../types/chat";
import fmesintellilogo from "../../../assets/fmesintellilogo.png";
import mesintellilogo from "../../../assets/mesintellilogo.png";
import { ChatIcon } from "./ChatIcon";

type ChatSidebarProps = {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: (value: boolean) => void;
  setSidebarCollapsed: (value: boolean) => void;
  conversations: Conversation[];
  conversationsStatus: "idle" | "loading" | "succeeded" | "failed";
  isStreaming: boolean;
  isLoading: boolean;
  openMenuConversationId: string | null;
  onOpenMenuConversation: (conversationId: string | null) => void;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
  onOpenConversationDialog: (
    type: "rename" | "delete",
    conversationId: string,
    title: string,
  ) => void;
  onSignOut: () => void;
  activeConversationId: string | null;
  user: { name?: string | null; email: string; id?: string } | null;
  userInitials: string;
};

export const ChatSidebar = ({
  sidebarOpen,
  sidebarCollapsed,
  setSidebarOpen,
  setSidebarCollapsed,
  conversations,
  conversationsStatus,
  isStreaming,
  isLoading,
  openMenuConversationId,
  onOpenMenuConversation,
  onNewConversation,
  onSelectConversation,
  onOpenConversationDialog,
  onSignOut,
  activeConversationId,
  user,
  userInitials,
}: ChatSidebarProps) => {
  return (
    <aside
      className={`relative fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 transition-all duration-200 md:static md:z-auto md:translate-x-0 ${
        sidebarCollapsed ? "w-[88px]" : "w-[292px]"
      } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      aria-label="Conversations"
    >
      {sidebarCollapsed && (
        <button
          type="button"
          className="absolute right-0 top-1/2 z-50 grid size-6 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-900"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChatIcon name="chevron" className="size-3.5 rotate-90" />
        </button>
      )}

      <div
        className={`relative flex h-[72px] items-center border-b border-zinc-200/80 px-3 ${
          sidebarCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <Link
          to="/"
          className={`flex items-center text-zinc-900 no-underline ${
            sidebarCollapsed
              ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              : "gap-3"
          }`}
        >
          {!sidebarCollapsed ? (
            <div className="flex h-8 w-36 items-center">
              <img
                src={fmesintellilogo}
                alt="Fmesintelli"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center">
              <img
                src={mesintellilogo}
                alt="Mesintelli"
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </Link>

        {!sidebarCollapsed && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hidden size-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 md:grid"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChatIcon
                name="chevron"
                className="size-4 -rotate-90 transition"
              />
            </button>

            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close conversations"
            >
              <ChatIcon name="close" />
            </button>
          </div>
        )}
      </div>

      <div
        className={`px-3 pb-4 pt-5 ${sidebarCollapsed ? "flex justify-center" : ""}`}
      >
        <button
          type="button"
          className={`flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 ${
            sidebarCollapsed ? "w-11 px-0" : "w-full px-4"
          }`}
          onClick={onNewConversation}
          disabled={isStreaming || isLoading}
          title="New conversation"
          aria-label="New conversation"
        >
          <ChatIcon name="plus" />
          {!sidebarCollapsed && "New conversation"}
        </button>
      </div>

      {!sidebarCollapsed && (
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Recent
          </h2>
          <span className="text-xs tabular-nums text-zinc-400">
            {conversationsStatus === "succeeded" ? conversations.length : "—"}
          </span>
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {conversationsStatus === "loading" || conversationsStatus === "idle" ? (
          <ul
            className={`space-y-2 pt-2 ${sidebarCollapsed ? "px-0" : "px-1"}`}
            aria-label="Loading conversations"
            aria-busy="true"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <li
                key={index}
                className={`flex items-center justify-center rounded-xl ${
                  sidebarCollapsed ? "h-10" : "h-10 gap-2.5 px-2"
                }`}
              >
                <span className="size-4 shrink-0 animate-pulse rounded bg-zinc-200" />
                {!sidebarCollapsed && (
                  <span
                    className={`h-3 animate-pulse rounded bg-zinc-200 ${
                      index % 2 === 0 ? "w-3/4" : "w-1/2"
                    }`}
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-2 pt-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <li key={conversation.id} className="relative">
                  <button
                    type="button"
                    className={`group flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                      isActive
                        ? "border-zinc-200 bg-zinc-50 text-zinc-900"
                        : "border-transparent bg-transparent text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-900"
                    } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                    onClick={() => onSelectConversation(conversation.id)}
                    aria-label={`Open ${conversation.title}`}
                    title={conversation.title}
                  >
                    <span
                      className={`grid size-4 shrink-0 place-items-center rounded-lg ${
                        isActive
                          ? "bg-zinc-100 text-zinc-900"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      <ChatIcon name="message" className="size-4" />
                    </span>

                    {!sidebarCollapsed && (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {conversation.title}
                        </span>
                      </span>
                    )}
                  </button>

                  {!sidebarCollapsed && (
                    <div className="absolute right-2 top-1/2 z-[9999] -translate-y-1/2">
                      <details
                        className="relative"
                        open={openMenuConversationId === conversation.id}
                        onToggle={(event) => {
                          const nextOpen = (
                            event.currentTarget as HTMLDetailsElement
                          ).open;

                          onOpenMenuConversation(
                            nextOpen ? conversation.id : null,
                          );
                        }}
                      >
                        <summary
                          data-conversation-menu-button
                          className="grid size-7 cursor-pointer list-none place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
                          aria-label={`More options for ${conversation.title}`}
                          title="More options"
                          onClick={(event) => {
                            event.preventDefault();
                            const isOpen =
                              openMenuConversationId === conversation.id;
                            onOpenMenuConversation(
                              isOpen ? null : conversation.id,
                            );
                          }}
                        >
                          <ChatIcon name="more" className="size-4" />
                        </summary>

                        <div
                          data-conversation-menu-panel
                          className="absolute right-0 top-8 z-[99999] w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
                            onClick={() => {
                              onOpenMenuConversation(null);
                              onOpenConversationDialog(
                                "rename",
                                conversation.id,
                                conversation.title,
                              );
                            }}
                          >
                            <ChatIcon name="edit" className="size-3.5" />
                            Rename
                          </button>

                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                            onClick={() => {
                              onOpenMenuConversation(null);
                              onOpenConversationDialog(
                                "delete",
                                conversation.id,
                                conversation.title,
                              );
                            }}
                          >
                            <ChatIcon name="trash" className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      </details>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {user && (
        <details className="group relative mt-auto border-t border-zinc-200/80 p-3">
          <summary
            className={`flex cursor-pointer list-none items-center rounded-xl p-2 transition hover:bg-zinc-200/70 [&::-webkit-details-marker]:hidden ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            }`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-zinc-500 to-zinc-600 text-xs font-bold text-white shadow-sm">
              {userInitials}
            </span>
            {!sidebarCollapsed && (
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13px] font-semibold text-zinc-800">
                  {user.name || "Your account"}
                </span>
                <span className="block truncate text-[11px] text-zinc-500">
                  {user.email}
                </span>
              </span>
            )}
            {!sidebarCollapsed && (
              <ChatIcon
                name="chevron"
                className="size-4 shrink-0 text-zinc-400 transition group-open:rotate-180"
              />
            )}
          </summary>
          <div className="absolute bottom-[calc(100%-4px)] left-3 right-3 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-950/10">
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              onClick={onSignOut}
            >
              Sign out
            </button>
          </div>
        </details>
      )}
    </aside>
  );
};
