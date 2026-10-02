import { z } from "zod";

import {
  careRecommendationStateSchema,
  conversationStateSchema,
} from "./conversation-state";

export const localeSchema =
  z.enum([
    "ar",
    "en",
  ]);

export const assistantActionSchema =
  z.enum([
    "urgent",
    "clarify",
    "provider_results",
    "guidance",
  ]);

export const chatMessageSchema =
  z
    .object({
      role:
        z.enum([
          "user",
          "assistant",
        ]),

      content:
        z
          .string()
          .trim()
          .min(1)
          .max(2000),

      /*
       * Retained for compatibility with
       * existing frontend conversation history.
       *
       * Operational state now lives in
       * conversationState.
       */
      action:
        assistantActionSchema
          .optional(),

      careRecommendation:
        careRecommendationStateSchema
          .optional(),
    })
    .strict();

export const chatRequestSchema =
  z
    .object({
      message:
        z
          .string()
          .trim()
          .min(1)
          .max(2000),

      /*
       * UI preference only.
       *
       * The AI router chooses the response
       * language for each individual turn.
       */
      locale:
        localeSchema.optional(),

      conversation:
        z
          .array(
            chatMessageSchema,
          )
          .max(20)
          .default([]),

      conversationState:
        conversationStateSchema
          .optional(),
    })
    .strict();

export type Locale =
  z.infer<
    typeof localeSchema
  >;

export type ChatMessage =
  z.infer<
    typeof chatMessageSchema
  >;

export type ChatRequest =
  z.infer<
    typeof chatRequestSchema
  >;