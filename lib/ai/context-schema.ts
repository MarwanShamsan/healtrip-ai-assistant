import { z } from "zod";

import {
  clinicalAssessmentSchema,
} from "./clinical-assessment-schema";

export const intentSchema =
  z.enum([
    "symptom_guidance",
    "provider_search",
    "hospital_search",
    "second_opinion",
    "care_navigation",
    "general_health_question",
    "follow_up",
    "off_topic",
  ]);

export const specialtySchema =
  z.enum([
    "Cardiology",
    "General Medicine",
    "Neurology",
    "Orthopedics",
    "Dermatology",
    "ENT",
  ]);

export const specialtySourceSchema =
  z.enum([
    "explicit",
    "navigation_default",
    "none",
  ]);

export const providerTypeSchema =
  z.enum([
    "doctor",
    "hospital",
  ]);

export const missingFieldSchema =
  z.enum([
    "city",
    "specialty",
    "providerType",
    "symptomDetails",
    "userGoal",
  ]);

export const extractedNextStepSchema =
  z.enum([
    "clarify",
    "doctor_search",
    "hospital_search",
    "general_guidance",
  ]);

/*
 * LEGACY COMPATIBILITY SCHEMA
 *
 * The active application runtime now uses:
 *
 * - router-schema.ts
 * - conversation-state.ts
 * - conversation-router.ts
 * - clinical-assessor.ts
 *
 * This schema remains temporarily because
 * context-extractor.ts and some older
 * development scripts are still compiled.
 */
export const contextExtractionSchema =
  z
    .object({
      intent:
        intentSchema,

      concernSummary:
        z
          .string()
          .trim()
          .min(1)
          .max(500),

      specialty:
        specialtySchema
          .nullable(),

      specialtySource:
        specialtySourceSchema,

      city:
        z
          .string()
          .trim()
          .min(1)
          .max(80)
          .nullable(),

      providerType:
        providerTypeSchema
          .nullable(),

      missingFields:
        z
          .array(
            missingFieldSchema,
          )
          .max(5),

      nextStep:
        extractedNextStepSchema,

      clarificationQuestion:
        z
          .string()
          .trim()
          .max(500)
          .nullable(),

      guidanceMessage:
        z
          .string()
          .trim()
          .max(900)
          .nullable(),

      clinicalAssessment:
        clinicalAssessmentSchema
          .nullable(),
    })
    .strict();

export type ExtractedContext =
  z.infer<
    typeof contextExtractionSchema
  >;