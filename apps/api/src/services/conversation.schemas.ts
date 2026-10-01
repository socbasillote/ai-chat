import { z } from "zod";

export const createConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters"),
});

export const updateConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters"),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
