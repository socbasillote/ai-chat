import mongoose, { Document, Model, Schema } from "mongoose";

export type MessageRole = "user" | "assistant" | "system";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: MessageRole;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  messageSchema,
);

export default Message;
