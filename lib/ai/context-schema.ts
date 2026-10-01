import { z } from "zod";

export const userIntentSchema = z.enum([
  "symptom_guidance",
  "provider_search",
  "hospital_search",
  "second_opinion",
  "care_navigation",
  "general_health_question",
  "follow_up",
]);

export const specialtySchema = z.enum([
  "Cardiology",
  "General Medicine",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "ENT",
]);

export const providerTypeSchema = z.enum([
  "doctor",
  "hospital",
]);

export const contextNextStepSchema = z.enum([
  "clarify",
  "doctor_search",
  "hospital_search",
  "general_guidance",
]);

export const contextExtractionSchema = z
  .object({
    intent: userIntentSchema,

    concernSummary: z
      .string()
      .trim()
      .min(1)
      .max(300),

    specialty: specialtySchema.nullable(),

    city: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .nullable(),

    providerType: providerTypeSchema.nullable(),

    missingFields: z.array(
      z.enum([
        "city",
        "specialty",
        "providerType",
        "symptomDetails",
        "userGoal",
      ]),
    ),

    nextStep: contextNextStepSchema,

    clarificationQuestion: z
      .string()
      .trim()
      .max(300)
      .nullable(),

    guidanceMessage: z
      .string()
      .trim()
      .max(600)
      .nullable(),
  })
  .strict();

export type ExtractedContext = z.infer<
  typeof contextExtractionSchema
>;