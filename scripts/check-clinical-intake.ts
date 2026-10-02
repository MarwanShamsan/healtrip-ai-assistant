import assert from "node:assert/strict";

import {
  config,
} from "dotenv";

config({
  path: ".env.local",
  override: true,
});

async function main() {
  const {
    runAgent,
  } = await import(
    "../lib/ai/agent"
  );

  console.log(
    "Checking AI clinical assessment...",
  );

  /*
   * Simulate a conversation where useful
   * clinical context has already been gathered.
   *
   * This uses only one AI request.
   */
  const assessment =
    await runAgent({
      message:
        "It started about 30 minutes ago and it is still happening. I don't have chest pain, trouble breathing, dizziness, or fainting. I drank a lot of coffee.",

      locale:
        "en",

      conversation: [
        {
          role:
            "user",

          content:
            "I feel my heart beating fast.",
        },

        {
          role:
            "assistant",

          content:
            "When did this start, is it still happening, and do you have chest pain, trouble breathing, dizziness, or fainting?",
        },
      ],
    });

  assert.equal(
    assessment.ok,
    true,
  );

  if (!assessment.ok) {
    throw new Error(
      "Clinical assessment failed.",
    );
  }

  assert.equal(
    assessment.meta.aiUsed,
    true,
  );

  assert.equal(
    assessment.meta.toolUsed,
    undefined,
  );

  assert.ok(
    assessment.state
      .clinicalAssessment,
  );

  if (
    assessment.state
      .clinicalAssessment
  ) {
    console.log(
      "AI care recommendation:",
      assessment.state
        .clinicalAssessment
        .careRecommendation,
    );

    console.log(
      "AI assessment summary:",
      assessment.state
        .clinicalAssessment
        .assessmentSummary,
    );

    console.log(
      "AI recommendation rationale:",
      assessment.state
        .clinicalAssessment
        .recommendationRationale,
    );
  }

  /*
   * The AI may decide it still needs one
   * more useful question, or it may already
   * have enough information to make a
   * navigation recommendation.
   *
   * Both are legitimate AI decisions.
   */
  assert.ok(
    assessment.response.action ===
      "clarify" ||
      assessment.response.action ===
        "guidance",
  );

  console.log(
    "Checking deterministic safety override...",
  );

  /*
   * No AI request should occur here.
   */
  const urgent =
    await runAgent({
      message:
        "I also have chest pain.",

      locale:
        "en",

      conversation:
        [],
    });

  assert.equal(
    urgent.ok,
    true,
  );

  if (!urgent.ok) {
    throw new Error(
      "Urgent safety flow failed.",
    );
  }

  assert.equal(
    urgent.response.action,
    "urgent",
  );

  assert.equal(
    urgent.meta.aiUsed,
    false,
  );

  assert.equal(
    urgent.meta.toolUsed,
    undefined,
  );

  console.log(
    "AI clinical assessment checks passed.",
  );

  console.log(
    JSON.stringify(
      {
        assessment,
        urgent,
      },
      null,
      2,
    ),
  );
}

main().catch(
  (error) => {
    console.error(
      "Clinical assessment check failed:",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    process.exitCode =
      1;
  },
);