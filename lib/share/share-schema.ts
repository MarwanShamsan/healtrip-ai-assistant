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
       * This must be the ID of a doctor
       * already returned in the current
       * provider-search flow.
       */
      doctorId:
        z
          .string()
          .trim()
          .min(1)
          .max(120),

      /*
       * We intentionally keep the validation
       * broad because booking systems use
       * different reference formats.
       */
      reservationReference:
        z
          .string()
          .trim()
          .min(1)
          .max(100),

      /*
       * User-reviewed information to include
       * in the reservation summary. The UI
       * prefills this from user-authored chat
       * messages, but the user may edit it.
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

      doctorId:
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