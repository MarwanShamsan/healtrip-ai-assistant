import { z } from "zod";

export const clinicalSeveritySchema =
  z.enum([
    "mild",
    "moderate",
    "severe",
  ]);

export const careRecommendationSchema =
  z.enum([
    "continue_assessment",
    "monitor_and_self_care",
    "see_doctor_routine",
    "see_doctor_soon",
    "urgent_in_person",
  ]);

export const missingClinicalInfoSchema =
  z.enum([
    "duration",
    "onset",
    "severity",
    "associatedSymptoms",
    "functionalImpact",
    "relevantHistory",
    "redFlags",
  ]);

export const clinicalAssessmentSchema =
  z
    .object({
      responseLanguage:
        z.enum([
          "en",
          "ar",
        ]),

      assessmentSummary:
        z
          .string()
          .trim()
          .min(1)
          .max(350),

      recommendationRationale:
        z
          .string()
          .trim()
          .min(1)
          .max(450),

      duration:
        z
          .string()
          .trim()
          .max(100)
          .nullable(),

      onset:
        z
          .string()
          .trim()
          .max(100)
          .nullable(),

      severity:
        clinicalSeveritySchema
          .nullable(),

      associatedSymptoms:
        z
          .array(
            z
              .string()
              .trim()
              .min(1)
              .max(100),
          )
          .max(6),

      relevantNegatives:
        z
          .array(
            z
              .string()
              .trim()
              .min(1)
              .max(100),
          )
          .max(6),

      functionalImpact:
        z
          .string()
          .trim()
          .max(160)
          .nullable(),

      missingClinicalInfo:
        z
          .array(
            missingClinicalInfoSchema,
          )
          .max(7),

      assessmentComplete:
        z.boolean(),

      careRecommendation:
        careRecommendationSchema,

      nextQuestion:
        z
          .string()
          .trim()
          .max(220)
          .nullable(),

      recommendationMessage:
        z
          .string()
          .trim()
          .max(600)
          .nullable(),
    })
    .strict();

export type ClinicalAssessment =
  z.infer<
    typeof clinicalAssessmentSchema
  >;