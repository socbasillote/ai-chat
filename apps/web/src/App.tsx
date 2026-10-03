import "./App.css";
import { useEffect, useState } from "react";
import { StreamingTest } from "./features/chat/StreamingTest";
import { createConversation } from "./services/conversation.service";

function App() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    createConversation().then(
      (conversation) => {
        if (!cancelled) {
          setConversationId(conversation.id);
        }
      },
      (reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to create conversation.",
          );
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p>{error}</p>;
  }

  if (!conversationId) {
    return <p>Starting conversation...</p>;
  }

  return <StreamingTest conversationId={conversationId} />;
}

export default App;

