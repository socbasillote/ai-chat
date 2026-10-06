export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type StreamEvent =
  | {
      type: "start";
      message: Message;
    }
  | {
      type: "chunk";
      content: string;
    }
  | {
      type: "done";
      message: Message;
    }
  | {
      type: "error";
      code?: string;
      message: string;
    };
