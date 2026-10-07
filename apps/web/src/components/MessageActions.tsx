import { useState } from "react";

interface MessageActionsProps {
  content: string;
}

export const MessageActions = ({ content }: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-2 flex">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-700"
      >
        {copied ? "Copied!" : "Copy response"}
      </button>
    </div>
  );
};
