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
  },

  required: [
    "intent",
    "concernSummary",
    "specialty",
    "city",
    "providerType",
    "missingFields",
    "nextStep",
    "clarificationQuestion",
    "guidanceMessage",
  ],

  additionalProperties: false,
} as const;

export async function extractContext(
  state: AgentState,
): Promise<ExtractedContext> {
  const conversationMessages =
    state.conversation.map((message) => ({
      role: message.role,
      content: message.content,
    }));

  const completion =
    await groq.chat.completions.create({
      model: GROQ_MODEL,

      reasoning_effort: "none",

      max_completion_tokens: 200,

      temperature: 0.1,

      messages: [
        {
          role: "system",
          content:
            buildContextExtractionPrompt(
              state.locale,
            ),
        },

        ...conversationMessages,

        {
          role: "user",
          content: state.userMessage,
        },
      ],

      response_format: {
        type: "json_schema",

        json_schema: {
          name: "healtrip_context",

          strict: true,

          schema: contextJsonSchema,
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
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error(
      "The AI context extractor returned invalid JSON.",
    );
  }

  return contextExtractionSchema.parse(
    parsedJson,
  );
}