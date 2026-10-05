import { type FormEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchConversations,
  fetchMessages,
  setActiveConversation,
} from "../store/chatSlice";
import { useChat } from "../hooks/use-chats";

import {
  createNewConversation,
  renameConversation,
  removeConversation,
} from "../store/chatSlice";

import { MarkdownMessage } from "../components/MarkdownMessage";
import { useAutoScroll } from "../hooks/use-auto-scroll";

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
    sendMessage,
    stopGeneration,
  } = useChat();

  const [input, setInput] = useState("");

  const messageContainerRef = useAutoScroll([messages, streamingMessage]);

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

  const handleNewConversation = async () => {
    if (isStreaming) return;

    const result = await dispatch(createNewConversation("New conversation"));

    if (createNewConversation.fulfilled.match(result)) {
      dispatch(setActiveConversation(result.payload.id));
    }
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

        <button
          type="button"
          onClick={handleNewConversation}
          disabled={isStreaming || isLoading}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "16px",
          }}
        >
          + New conversation
        </button>

        {conversations.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              style={{
                display: "flex",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => handleSelectConversation(conversation.id)}
                disabled={isStreaming}
                style={{
                  flex: 1,
                  padding: "10px",
                  textAlign: "left",
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

              <button
                type="button"
                disabled={isStreaming}
                onClick={async () => {
                  const title = window.prompt(
                    "Rename conversation:",
                    conversation.title,
                  );

                  if (!title?.trim()) return;

                  await dispatch(
                    renameConversation({
                      conversationId: conversation.id,
                      title: title.trim(),
                    }),
                  );
                }}
                title="Rename conversation"
              >
                ✎
              </button>

              <button
                type="button"
                disabled={isStreaming}
                onClick={async () => {
                  const confirmed = window.confirm("Delete this conversation?");

                  if (!confirmed) return;

                  await dispatch(removeConversation(conversation.id));
                }}
                title="Delete conversation"
              >
                ×
              </button>
            </div>
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
          ref={messageContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {messages.length === 0 && !streamingMessage && !isLoading ? (
            <div
              style={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#666",
              }}
            >
              <div>
                <h2>Start a conversation</h2>
                <p>Ask the AI assistant anything.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: isUser ? "#2563eb" : "#f1f1f1",
                        color: isUser ? "#fff" : "#111",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          marginBottom: "6px",
                          opacity: 0.7,
                        }}
                      >
                        {isUser ? "You" : "Assistant"}
                      </div>

                      {isUser ? (
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.6,
                          }}
                        >
                          {message.content}
                        </div>
                      ) : (
                        <MarkdownMessage content={message.content} />
                      )}
                    </div>
                  </div>
                );
              })}

              {streamingMessage && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "#f1f1f1",
                      color: "#111",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "6px",
                        opacity: 0.7,
                      }}
                    >
                      Assistant
                    </div>

                    <div>
                      <MarkdownMessage content={streamingMessage.content} />

                      <span>▌</span>
                    </div>
                  </div>
                </div>
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
              Stop generating
            </button>
          ) : (
            <button
              type="submit"
              disabled={!activeConversationId || !input.trim() || isLoading}
            >
              Send
            </button>
          )}
        </form>
      </main>
    </div>
  );
};
