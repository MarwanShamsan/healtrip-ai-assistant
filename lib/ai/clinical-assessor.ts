import {
  clinicalAssessmentSchema,
  type ClinicalAssessment,
} from "./clinical-assessment-schema";

import type {
  ResponseLanguage,
} from "./conversation-state";

import {
  GROQ_MODEL,
  groq,
} from "./groq";

import {
  buildClinicalAssessmentPrompt,
} from "./prompts";

import type {
  AgentState,
} from "./types";

const clinicalAssessmentJsonSchema = {
  type:
    "object",

  properties: {
    responseLanguage: {
      type:
        "string",

      enum: [
        "en",
        "ar",
      ],
    },

    assessmentSummary: {
      type:
        "string",

      maxLength:
        350,
    },

    recommendationRationale: {
      type:
        "string",

      maxLength:
        450,
    },

    duration: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            100,
        },
        {
          type:
            "null",
        },
      ],
    },

    onset: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            100,
        },
        {
          type:
            "null",
        },
      ],
    },

    severity: {
      anyOf: [
        {
          type:
            "string",

          enum: [
            "mild",
            "moderate",
            "severe",
          ],
        },
        {
          type:
            "null",
        },
      ],
    },

    associatedSymptoms: {
      type:
        "array",

      maxItems:
        6,

      items: {
        type:
          "string",

        maxLength:
          100,
      },
    },

    relevantNegatives: {
      type:
        "array",

      maxItems:
        6,

      items: {
        type:
          "string",

        maxLength:
          100,
      },
    },

    functionalImpact: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            160,
        },
        {
          type:
            "null",
        },
      ],
    },

    missingClinicalInfo: {
      type:
        "array",

      maxItems:
        7,

      items: {
        type:
          "string",

        enum: [
          "duration",
          "onset",
          "severity",
          "associatedSymptoms",
          "functionalImpact",
          "relevantHistory",
          "redFlags",
        ],
      },
    },

    assessmentComplete: {
      type:
        "boolean",
    },

    careRecommendation: {
      type:
        "string",

      enum: [
        "continue_assessment",
        "monitor_and_self_care",
        "see_doctor_routine",
        "see_doctor_soon",
        "urgent_in_person",
      ],
    },

    nextQuestion: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            220,
        },
        {
          type:
            "null",
        },
      ],
    },

    recommendationMessage: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            600,
        },
        {
          type:
            "null",
        },
      ],
    },
  },

  required: [
    "responseLanguage",
    "assessmentSummary",
    "recommendationRationale",
    "duration",
    "onset",
    "severity",
    "associatedSymptoms",
    "relevantNegatives",
    "functionalImpact",
    "missingClinicalInfo",
    "assessmentComplete",
    "careRecommendation",
    "nextQuestion",
    "recommendationMessage",
  ],

  additionalProperties:
    false,
} as const;

export async function assessClinicalContext(
  state: AgentState,
  currentLanguage: ResponseLanguage,
): Promise<ClinicalAssessment> {
  const history =
    state.conversation.map(
      (message) => ({
        role:
          message.role,

        content:
          message.content,
      }),
    );

  const completion =
    await groq.chat.completions.create({
      model:
        GROQ_MODEL,

      reasoning_effort:
        "none",

      /*
       * Clinical-only JSON is considerably
       * smaller than the old monolithic
       * context object.
       */
      max_completion_tokens:
        300,

      temperature:
        0.2,

      messages: [
        {
          role:
            "system",

          content:
            buildClinicalAssessmentPrompt(
              currentLanguage,
            ),
        },

        ...history,

        {
          role:
            "user",

          content:
            state.userMessage,
        },
      ],

      response_format: {
        type:
          "json_schema",

        json_schema: {
          name:
            "healtrip_clinical_assessment",

          strict:
            true,

          schema:
            clinicalAssessmentJsonSchema,
        },
      },
    });

  const content =
    completion.choices[0]
      ?.message
      ?.content;

  if (!content) {
    throw new Error(
      "Clinical assessor returned no content.",
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        content,
      );
  } catch {
    throw new Error(
      "Clinical assessor returned invalid JSON.",
    );
  }

  return clinicalAssessmentSchema.parse(
    parsed,
  );
}