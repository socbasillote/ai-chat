import { FormEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchConversations,
  fetchMessages,
  setActiveConversation,
} from "../store/chatSlice";
import { useChat } from "../hooks/use-chats";

export const ChatPage = () => {
  const dispatch = useAppDispatch();

  const { conversations, activeConversationId } = useAppSelector(
    (state) => state.chat,
  );

  const {
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
  } = useChat();

  const [input, setInput] = useState("");

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchMessages(activeConversationId));
    }
  }, [dispatch, activeConversationId]);

  const handleSelectConversation = (conversationId: string) => {
    if (isStreaming) return;

    dispatch(setActiveConversation(conversationId));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();

    if (!content || !activeConversationId || isStreaming) {
      return;
    }

    setInput("");

    await sendMessage(activeConversationId, content);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
      }}
    >
      <aside
        style={{
          width: "280px",
          borderRight: "1px solid #ddd",
          padding: "16px",
          overflowY: "auto",
        }}
      >
        <h2>Conversations</h2>

        {conversations.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => handleSelectConversation(conversation.id)}
              disabled={isStreaming}
              style={{
                display: "block",
                width: "100%",
                padding: "10px",
                marginBottom: "8px",
                textAlign: "left",
                cursor: isStreaming ? "not-allowed" : "pointer",
                background:
                  conversation.id === activeConversationId
                    ? "#eee"
                    : "transparent",
                border: "1px solid #ddd",
                borderRadius: "6px",
              }}
            >
              {conversation.title}
            </button>
          ))
        )}
      </aside>

      <main
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <header
          style={{
            padding: "16px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <h1>AI Chat</h1>
        </header>

        <section
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {!activeConversationId ? (
            <div>
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the sidebar to start chatting.</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: "16px",
                  }}
                >
                  <strong>
                    {message.role === "user" ? "You" : "Assistant"}
                  </strong>

                  <div
                    style={{
                      marginTop: "4px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {streamingMessage && (
                <div
                  style={{
                    marginBottom: "16px",
                  }}
                >
                  <strong>Assistant</strong>

                  <div
                    style={{
                      marginTop: "4px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {streamingMessage.content}
                    <span>▌</span>
                  </div>
                </div>
              )}

              {isLoading && <p>Loading messages...</p>}

              {error && (
                <p
                  role="alert"
                  style={{
                    color: "red",
                  }}
                >
                  {error}
                </p>
              )}
            </>
          )}
        </section>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: "8px",
            padding: "16px",
            borderTop: "1px solid #ddd",
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              activeConversationId
                ? "Send a message..."
                : "Select a conversation first"
            }
            disabled={!activeConversationId || isStreaming}
            rows={3}
            style={{
              flex: 1,
              resize: "vertical",
              padding: "10px",
            }}
          />

          {isStreaming ? (
            <button type="button" onClick={stopGeneration}>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!activeConversationId || !input.trim()}
            >
              Send
            </button>
          )}
        </form>
      </main>
    </div>
  );
};
