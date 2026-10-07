import type { FormEvent } from "react";

type DialogState = {
  type: "rename" | "delete";
  conversationId: string;
  title: string;
};

type ConversationDialogProps = {
  dialog: DialogState | null;
  renameTitle: string;
  setRenameTitle: (value: string) => void;
  actionError: string | null;
  isActionLoading: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const ConversationDialog = ({
  dialog,
  renameTitle,
  setRenameTitle,
  actionError,
  isActionLoading,
  onClose,
  onSubmit,
}: ConversationDialogProps) => {
  if (!dialog) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
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
        <form className="mt-5" onSubmit={onSubmit}>
          {dialog.type === "rename" && (
            <label
              className="block text-sm font-medium text-zinc-700"
              htmlFor="conversation-title"
            >
              Conversation name
              <input
                autoFocus
                id="conversation-title"
                className="mt-2 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 disabled:bg-zinc-50"
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                maxLength={200}
                required
                disabled={isActionLoading}
              />
            </label>
          )}
          {actionError && (
            <p
              className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
            >
              {actionError}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="min-h-10 rounded-lg px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
              onClick={onClose}
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
  );
};
