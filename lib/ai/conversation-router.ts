import {
  conversationRouteSchema,
  type ConversationRoute,
} from "./router-schema";

import {
  GROQ_MODEL,
  groq,
} from "./groq";

import {
  buildConversationRouterPrompt,
} from "./prompts";

import type {
  AgentState,
} from "./types";

const conversationRouteJsonSchema = {
  type:
    "object",

  properties: {
    action: {
      type:
        "string",

      enum: [
        "clinical_assessment",
        "find_provider",
        "more_provider_results",
        "update_location",
        "ask_about_recommendation",
        "general_conversation",
        "off_topic",
      ],
    },

    responseLanguage: {
      type:
        "string",

      enum: [
        "en",
        "ar",
      ],
    },

    preferredName: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            80,
        },
        {
          type:
            "null",
        },
      ],
    },

    city: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            80,
        },
        {
          type:
            "null",
        },
      ],
    },

    country: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            80,
        },
        {
          type:
            "null",
        },
      ],
    },

    locationScope: {
      type:
        "string",

      enum: [
        "city",
        "country",
        "unknown",
      ],
    },

    providerType: {
      anyOf: [
        {
          type:
            "string",

          enum: [
            "doctor",
            "hospital",
          ],
        },
        {
          type:
            "null",
        },
      ],
    },

    specialty: {
      anyOf: [
        {
          type:
            "string",

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
          type:
            "null",
        },
      ],
    },

    replyMessage: {
      anyOf: [
        {
          type:
            "string",

          maxLength:
            500,
        },
        {
          type:
            "null",
        },
      ],
    },
  },

  required: [
    "action",
    "responseLanguage",
    "preferredName",
    "city",
    "country",
    "locationScope",
    "providerType",
    "specialty",
    "replyMessage",
  ],

  additionalProperties:
    false,
} as const;

export async function routeConversation(
  state: AgentState,
): Promise<ConversationRoute> {
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
       * Still intentionally small.
       *
       * We added country/locationScope,
       * so give the structured response a
       * little more room than before.
       */
      max_completion_tokens:
        120,

      temperature:
        0.1,

      messages: [
        {
          role:
            "system",

          content:
            buildConversationRouterPrompt(
              state.conversationState,
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
            "healtrip_conversation_route",

          strict:
            true,

          schema:
            conversationRouteJsonSchema,
        },
      },
    });

  const content =
    completion.choices[0]
      ?.message
      ?.content;

  if (!content) {
    throw new Error(
      "Conversation router returned no content.",
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
      "Conversation router returned invalid JSON.",
    );
  }

  return conversationRouteSchema.parse(
    parsed,
  );
}