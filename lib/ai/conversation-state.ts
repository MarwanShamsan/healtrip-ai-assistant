import { z } from "zod";

export const responseLanguageSchema =
  z.enum([
    "en",
    "ar",
  ]);

export const careRecommendationStateSchema =
  z.enum([
    "monitor_and_self_care",
    "see_doctor_routine",
    "see_doctor_soon",
    "urgent_in_person",
  ]);

export const conversationPhaseSchema =
  z.enum([
    "idle",
    "clinical_intake",
    "care_recommended",
    "awaiting_city",
    "provider_results",
    "urgent_care",
  ]);

export const awaitingFieldSchema =
  z.enum([
    "city",
    "specialty",
  ]);

export const providerTypeStateSchema =
  z.enum([
    "doctor",
    "hospital",
  ]);

export const specialtyStateSchema =
  z.enum([
    "Cardiology",
    "General Medicine",
    "Neurology",
    "Orthopedics",
    "Dermatology",
    "ENT",
  ]);

export const lastProviderSearchSchema =
  z
    .object({
      providerType:
        providerTypeStateSchema,

      city:
        z
          .string()
          .trim()
          .min(1)
          .max(80),

      specialty:
        specialtyStateSchema
          .nullable(),

      emergencyAvailable:
        z
          .boolean()
          .nullable(),

      shownProviderIds:
        z
          .array(
            z.string(),
          )
          .max(20),
    })
    .strict();

export const conversationStateSchema =
  z
    .object({
      phase:
        conversationPhaseSchema,

      responseLanguage:
        responseLanguageSchema,

      preferredName:
        z
          .string()
          .trim()
          .min(1)
          .max(80)
          .nullable(),

      careRecommendation:
        careRecommendationStateSchema
          .nullable(),

      providerType:
        providerTypeStateSchema
          .nullable(),

      specialty:
        specialtyStateSchema
          .nullable(),

      city:
        z
          .string()
          .trim()
          .min(1)
          .max(80)
          .nullable(),

      awaiting:
        awaitingFieldSchema
          .nullable(),

      lastSearch:
        lastProviderSearchSchema
          .nullable(),

      /*
       * These fields preserve the AI's
       * completed clinical reasoning so
       * follow-up questions don't need to
       * recreate the assessment.
       *
       * They are optional on input during
       * migration so the existing UI state
       * remains compatible.
       */
      lastClinicalSummary:
        z
          .string()
          .trim()
          .max(350)
          .nullable()
          .optional()
          .default(null),

      lastRecommendationRationale:
        z
          .string()
          .trim()
          .max(450)
          .nullable()
          .optional()
          .default(null),

      lastRecommendationMessage:
        z
          .string()
          .trim()
          .max(600)
          .nullable()
          .optional()
          .default(null),
    })
    .strict();

export type ResponseLanguage =
  z.infer<
    typeof responseLanguageSchema
  >;

export type ConversationState =
  z.infer<
    typeof conversationStateSchema
  >;

export function createInitialConversationState(
  language: ResponseLanguage = "en",
): ConversationState {
  return {
    phase:
      "idle",

    responseLanguage:
      language,

    preferredName:
      null,

    careRecommendation:
      null,

    providerType:
      null,

    specialty:
      null,

    city:
      null,

    awaiting:
      null,

    lastSearch:
      null,

    lastClinicalSummary:
      null,

    lastRecommendationRationale:
      null,

    lastRecommendationMessage:
      null,
  };
}