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
    <div
      style={{
        display: "flex",
        marginTop: "8px",
      }}
    >
      <button
        type="button"
        onClick={handleCopy}
        style={{
          padding: "4px 8px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          background: "#fff",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied!" : "Copy response"}
      </button>
    </div>
  );
};
