import { z } from "zod";

export const localeSchema = z.enum(["ar", "en"]);

export const chatMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z
      .string()
      .trim()
      .min(1, "Message content is required.")
      .max(2000, "Message content is too long."),
  })
  .strict();

export const chatRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Message is required.")
      .max(2000, "Message is too long."),

    locale: localeSchema.optional(),

    conversation: z
      .array(chatMessageSchema)
      .max(20, "Conversation history is too large.")
      .default([]),
  })
  .strict();

export type Locale = z.infer<typeof localeSchema>;

export type ChatMessage = z.infer<
  typeof chatMessageSchema
>;

export type ChatRequest = z.infer<
  typeof chatRequestSchema
>;