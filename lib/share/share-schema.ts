import { z } from "zod";

import {
  conversationStateSchema,
} from "../ai/conversation-state";

export const shareModeSchema =
  z.enum([
    "preview",
    "confirm",
  ]);

export const shareRequestSchema =
  z
    .object({
      mode:
        shareModeSchema,

      /*
       * The selected provider must come from
       * the trusted provider results already
       * shown in the current conversation.
       */
      providerType:
        z.enum([
          "doctor",
          "hospital",
        ]),

      providerId:
        z
          .string()
          .trim()
          .min(1)
          .max(120),

      /*
       * Required for doctor reservation-sharing.
       * Optional for hospital/urgent visit summaries.
       */
      reservationReference:
        z
          .string()
          .trim()
          .max(100)
          .optional()
          .default(""),

      /*
       * User-reviewed symptoms / relevant clinical
       * information. The UI prefills only clinically
       * relevant information and the user may edit it.
       */
      reportedConcern:
        z
          .string()
          .trim()
          .min(1)
          .max(8000),

      /*
       * Structured state only.
       *
       * We do not send the entire raw chat
       * transcript into this workflow.
       */
      conversationState:
        conversationStateSchema,

      consent:
        z
          .boolean()
          .optional()
          .default(false),
    })
    .strict();

export const shareStatusSchema =
  z.enum([
    "preview",
    "ready_to_share",
  ]);

export const preparedShareSchema =
  z
    .object({
      status:
        shareStatusSchema,

      providerType:
        z.enum([
          "doctor",
          "hospital",
        ]),

      providerId:
        z.string(),

      reservationReference:
        z.string(),

      reportedConcern:
        z.string(),

      careRecommendation:
        z
          .enum([
            "monitor_and_self_care",
            "see_doctor_routine",
            "see_doctor_soon",
            "urgent_in_person",
          ])
          .nullable(),

      recommendation:
        z
          .string()
          .nullable(),

      consentGiven:
        z.boolean(),
    })
    .strict();

export type ShareRequest =
  z.infer<
    typeof shareRequestSchema
  >;

export type PreparedShare =
  z.infer<
    typeof preparedShareSchema
  >;
