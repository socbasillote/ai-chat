import type { FormEvent, RefObject } from "react";

import { ChatIcon } from "./ChatIcon";

type ChatComposerProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  input: string;
  setInput: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  activeConversationId: string | null;
  canSubmit: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  stopGeneration: () => void;
};

export const ChatComposer = ({
  textareaRef,
  input,
  setInput,
  onSubmit,
  activeConversationId,
  canSubmit,
  isStreaming,
  isLoading,
  stopGeneration,
}: ChatComposerProps) => {
  return (
    <footer className="shrink-0 border-t border-zinc-100 bg-white px-4 pb-4 pt-4 sm:px-6 sm:pb-6 lg:px-10">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-3xl"
        aria-label="Send a message"
      >
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.06)] transition focus-within:border-zinc-300 focus-within:ring-4 focus-within:ring-zinc-500/10">
          <textarea
            ref={textareaRef}
            className="max-h-48 min-h-[58px] w-full resize-none overflow-y-hidden bg-transparent px-4 pb-2 pt-4 text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (
                input.trim() &&
                activeConversationId &&
                !isStreaming &&
                !isLoading &&
                canSubmit
              ) {
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={
              activeConversationId
                ? "Message your assistant..."
                : "Start a new conversation to begin"
            }
            disabled={!activeConversationId || !canSubmit}
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
                aria-label="Stop generating"
              >
                <ChatIcon name="stop" className="size-3.5" />
                Stop generating
              </button>
            ) : (
              <button
                type="submit"
                className="grid size-9 place-items-center rounded-xl bg-zinc-600 text-white shadow-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
                disabled={
                  !activeConversationId ||
                  !input.trim() ||
                  isLoading ||
                  !canSubmit
                }
                aria-label="Send message"
                title="Send message"
              >
                <ChatIcon name="send" className="size-4" />
              </button>
            )}
          </div>
        </div>
      </form>
    </footer>
  );
};
