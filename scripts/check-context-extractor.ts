import assert from "node:assert/strict";

import {
  config,
} from "dotenv";

import type {
  AgentState,
} from "../lib/ai/types";

config({
  path:
    ".env.local",

  override:
    true,
});

async function main() {
  const {
    routeConversation,
  } = await import(
    "../lib/ai/conversation-router"
  );

  console.log(
    "Checking semantic conversation router...",
  );

  /*
   * The user was already shown one
   * emergency-capable hospital in Riyadh
   * and now asks in Arabic for another.
   *
   * There is intentionally no phrase
   * matching here. Qwen must understand
   * the semantic follow-up.
   */
  const state: AgentState = {
    locale:
      "ar",

    userMessage:
      "في غيره؟",

    conversation: [
      {
        role:
          "user",

        content:
          "I need an emergency hospital in Riyadh.",
      },

      {
        role:
          "assistant",

        content:
          "These demo facilities report emergency services in the provider database.",

        action:
          "provider_results",
      },
    ],

    safetyStatus:
      "urgent",

    conversationState: {
      phase:
        "urgent_care",

      responseLanguage:
        "ar",

      preferredName:
        null,

      careRecommendation:
        "urgent_in_person",

      providerType:
        "hospital",

      specialty:
        null,

      city:
        "Riyadh",

      awaiting:
        null,

      lastSearch: {
        providerType:
          "hospital",

        city:
          "Riyadh",

        specialty:
          null,

        emergencyAvailable:
          true,

        shownProviderIds: [
          "hosp_demo_riyadh_central",
        ],
      },

      /*
       * New state fields added by the
       * stateful clinical-assessment refactor.
       *
       * This router test does not need
       * clinical content, so null is correct.
       */
      lastClinicalSummary:
        null,

      lastRecommendationRationale:
        null,

      lastRecommendationMessage:
        null,
    },

    urgentContextActive:
      true,

    previousCareRecommendation:
      "urgent_in_person",

    missingFields:
      [],
  };

  const route =
    await routeConversation(
      state,
    );

  console.log(
    "Router result:",
  );

  console.log(
    JSON.stringify(
      route,
      null,
      2,
    ),
  );

  assert.equal(
    route.action,
    "more_provider_results",
  );

  assert.equal(
    route.responseLanguage,
    "ar",
  );

  /*
   * Also verify language switching.
   *
   * Same conversation state, but latest
   * message changes to English.
   */
  const englishFollowUp: AgentState =
    {
      ...state,

      locale:
        "en",

      userMessage:
        "actually show me options in Jeddah instead",
    };

  const englishRoute =
    await routeConversation(
      englishFollowUp,
    );

  console.log(
    "Language-switch result:",
  );

  console.log(
    JSON.stringify(
      englishRoute,
      null,
      2,
    ),
  );

  assert.equal(
    englishRoute.action,
    "update_location",
  );

  assert.equal(
    englishRoute.responseLanguage,
    "en",
  );

  assert.equal(
    englishRoute.city,
    "Jeddah",
  );

  console.log(
    "Semantic router checks passed.",
  );
}

main().catch(
  (error) => {
    console.error(
      "Semantic router check failed:",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    process.exitCode =
      1;
  },
);