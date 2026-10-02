import { z } from "zod";

import {
  providerTypeStateSchema,
  responseLanguageSchema,
  specialtyStateSchema,
} from "./conversation-state";

export const conversationActionSchema =
  z.enum([
    "clinical_assessment",
    "find_provider",
    "more_provider_results",
    "update_location",
    "ask_about_recommendation",
    "general_conversation",
    "off_topic",
  ]);

export const locationScopeSchema =
  z.enum([
    "city",
    "country",
    "unknown",
  ]);

export const conversationRouteSchema =
  z
    .object({
      action:
        conversationActionSchema,

      responseLanguage:
        responseLanguageSchema,

      preferredName:
        z
          .string()
          .trim()
          .min(1)
          .max(80)
          .nullable(),

      /*
       * A country must never be placed
       * inside this field.
       */
      city:
        z
          .string()
          .trim()
          .min(1)
          .max(80)
          .nullable(),

      /*
       * Country extracted from the latest
       * message when one is provided.
       */
      country:
        z
          .string()
          .trim()
          .min(1)
          .max(80)
          .nullable(),

      /*
       * Tells application code whether the
       * location is sufficiently specific
       * for a city-based provider search.
       */
      locationScope:
        locationScopeSchema,

      providerType:
        providerTypeStateSchema
          .nullable(),

      specialty:
        specialtyStateSchema
          .nullable(),

      replyMessage:
        z
          .string()
          .trim()
          .max(500)
          .nullable(),
    })
    .strict();

export type ConversationRoute =
  z.infer<
    typeof conversationRouteSchema
  >;

export type LocationScope =
  z.infer<
    typeof locationScopeSchema
  >;