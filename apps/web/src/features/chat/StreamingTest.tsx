import { useState } from "react";
import { useChatStream } from "../../hooks/use-chat-stream";

interface StreamingTestProps {
  conversationId: string;
}

export const StreamingTest = ({ conversationId }: StreamingTestProps) => {
  const [content, setContent] = useState("");

  const { isStreaming, streamingMessage, error, sendMessage, stopGeneration } =
    useChatStream();

  const handleSend = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent || isStreaming) {
      return;
    }

    setContent("");

    await sendMessage(conversationId, trimmedContent);
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Send a message..."
        disabled={isStreaming}
      />

      {!isStreaming ? (
        <button type="button" onClick={handleSend}>
          Send
        </button>
      ) : (
        <button type="button" onClick={stopGeneration}>
          Stop
        </button>
      )}

      {error && <p>{error}</p>}

      {streamingMessage && (
        <div>
          <strong>Assistant:</strong>

          <p>{streamingMessage.content}</p>
        </div>
      )}
    </div>
  );
};
