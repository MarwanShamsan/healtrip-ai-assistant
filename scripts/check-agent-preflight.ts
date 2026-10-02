import assert from "node:assert/strict";

import {
  chatRequestSchema,
} from "../lib/ai/schemas";

import {
  screenForUrgency,
} from "../lib/ai/safety";

function main() {
  console.log(
    "Checking request validation...",
  );

  const validRequest =
    chatRequestSchema.safeParse({
      message:
        "I have a headache.",

      locale:
        "en",

      conversation:
        [],
    });

  assert.equal(
    validRequest.success,
    true,
  );

  const invalidRequest =
    chatRequestSchema.safeParse({
      message:
        "",

      locale:
        "en",

      conversation:
        [],
    });

  assert.equal(
    invalidRequest.success,
    false,
  );

  console.log(
    "Checking deterministic pre-AI safety...",
  );

  const routine =
    screenForUrgency(
      "I have a headache.",
      "en",
    );

  assert.equal(
    routine.status,
    "clear",
  );

  const urgent =
    screenForUrgency(
      "I cannot breathe.",
      "en",
    );

  assert.equal(
    urgent.status,
    "urgent",
  );

  /*
   * Important:
   *
   * Current-message urgent safety is
   * deterministic and does not require
   * an LLM call.
   */
  assert.equal(
    urgent.status,
    "urgent",
  );

  console.log(
    "Agent pre-AI checks passed.",
  );

  console.log(
    JSON.stringify(
      {
        validRequest:
          validRequest.success,

        invalidRequestRejected:
          !invalidRequest.success,

        routine,

        urgent,
      },
      null,
      2,
    ),
  );
}

main();