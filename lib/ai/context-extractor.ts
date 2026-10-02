import {
  contextExtractionSchema,
  type ExtractedContext,
} from "./context-schema";

import {
  GROQ_MODEL,
  groq,
} from "./groq";

import {
  buildContextExtractionPrompt,
} from "./prompts";

import type {
  AgentState,
} from "./types";

const clinicalAssessmentJsonSchema = {
  type: "object",

  properties: {
    assessmentSummary: {
      type: "string",
    },

    recommendationRationale: {
      type: "string",
    },

    duration: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    onset: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    severity: {
      anyOf: [
        {
          type: "string",

          enum: [
            "mild",
            "moderate",
            "severe",
          ],
        },
        {
          type: "null",
        },
      ],
    },

    associatedSymptoms: {
      type: "array",

      items: {
        type: "string",
      },
    },

    relevantNegatives: {
      type: "array",

      items: {
        type: "string",
      },
    },

    functionalImpact: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    missingClinicalInfo: {
      type: "array",

      items: {
        type: "string",

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
      type: "boolean",
    },

    careRecommendation: {
      type: "string",

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
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    recommendationMessage: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },
  },

  required: [
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

  additionalProperties: false,
} as const;

const contextJsonSchema = {
  type: "object",

  properties: {
    intent: {
      type: "string",

      enum: [
        "symptom_guidance",
        "provider_search",
        "hospital_search",
        "second_opinion",
        "care_navigation",
        "general_health_question",
        "follow_up",
        "off_topic",
      ],
    },

    concernSummary: {
      type: "string",
    },

    specialty: {
      anyOf: [
        {
          type: "string",

          enum: [
            "Cardiology",
            "General Medicine",
            "Neurology",
            "Orthopedics",
            "Dermatology",
            "ENT",
          ],
        },
        {
          type: "null",
        },
      ],
    },

    specialtySource: {
      type: "string",

      enum: [
        "explicit",
        "navigation_default",
        "none",
      ],
    },

    city: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    providerType: {
      anyOf: [
        {
          type: "string",

          enum: [
            "doctor",
            "hospital",
          ],
        },
        {
          type: "null",
        },
      ],
    },

    missingFields: {
      type: "array",

      items: {
        type: "string",

        enum: [
          "city",
          "specialty",
          "providerType",
          "symptomDetails",
          "userGoal",
        ],
      },
    },

    nextStep: {
      type: "string",

      enum: [
        "clarify",
        "doctor_search",
        "hospital_search",
        "general_guidance",
      ],
    },

    clarificationQuestion: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    guidanceMessage: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    clinicalAssessment: {
      anyOf: [
        clinicalAssessmentJsonSchema,

        {
          type: "null",
        },
      ],
    },
  },

  required: [
    "intent",
    "concernSummary",
    "specialty",
    "specialtySource",
    "city",
    "providerType",
    "missingFields",
    "nextStep",
    "clarificationQuestion",
    "guidanceMessage",
    "clinicalAssessment",
  ],

  additionalProperties: false,
} as const;

export async function extractContext(
  state: AgentState,
): Promise<ExtractedContext> {
  const conversationMessages =
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

      max_completion_tokens:
        450,

      temperature:
        0.2,

      messages: [
        {
          role:
            "system",

          content:
            buildContextExtractionPrompt(
              state.locale,
              state.urgentContextActive,
              state.previousCareRecommendation,
            ),
        },

        ...conversationMessages,

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
            "healtrip_context",

          strict:
            true,

          schema:
            contextJsonSchema,
        },
      },
    });

  const content =
    completion.choices[0]?.message
      ?.content;

  if (!content) {
    throw new Error(
      "The AI context extractor returned no content.",
    );
  }

  let parsedJson: unknown;

  try {
    parsedJson =
      JSON.parse(
        content,
      );
  } catch {
    throw new Error(
      "The AI context extractor returned invalid JSON.",
    );
  }

  return contextExtractionSchema.parse(
    parsedJson,
  );
}