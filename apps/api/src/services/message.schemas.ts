import { z } from "zod";

export const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(20_000, "Message content must not exceed 20,000 characters"),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
