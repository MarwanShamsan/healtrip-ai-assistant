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
    "Checking Arabic doctor search...",
  );

  const arabicDoctor =
    await runAgent({
      message:
        "أحتاج طبيب قلب في الرياض",

      locale: "ar",

      conversation: [],
    });

  assert.equal(
    arabicDoctor.ok,
    true,
  );

  if (!arabicDoctor.ok) {
    throw new Error(
      "Arabic doctor flow failed.",
    );
  }

  assert.equal(
    arabicDoctor.response.action,
    "provider_results",
  );

  assert.equal(
    arabicDoctor.meta.aiUsed,
    true,
  );

  assert.equal(
    arabicDoctor.meta.toolUsed,
    "search_doctors",
  );

  if (
    arabicDoctor.response.action !==
    "provider_results"
  ) {
    throw new Error(
      "Expected provider results.",
    );
  }

  assert.ok(
    arabicDoctor.response.providers
      .length > 0,
  );

  assert.equal(
    arabicDoctor.response
      .providers[0]
      ?.providerType,
    "doctor",
  );

  console.log(
    "Checking English clarification...",
  );

  const clarification =
    await runAgent({
      message:
        "I need a cardiologist.",

      locale: "en",

      conversation: [],
    });

  assert.equal(
    clarification.ok,
    true,
  );

  if (!clarification.ok) {
    throw new Error(
      "Clarification flow failed.",
    );
  }

  assert.equal(
    clarification.response.action,
    "clarify",
  );

  assert.equal(
    clarification.meta.aiUsed,
    true,
  );

  assert.equal(
    clarification.meta.toolUsed,
    undefined,
  );

  console.log(
    "Checking deterministic urgent routing...",
  );

  const urgent =
    await runAgent({
      message:
        "I have chest pain and difficulty breathing.",

      locale: "en",

      conversation: [],
    });

  assert.equal(
    urgent.ok,
    true,
  );

  if (!urgent.ok) {
    throw new Error(
      "Urgent flow failed.",
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
    "End-to-end agent routing checks passed.",
  );

  console.log(
    JSON.stringify(
      {
        arabicDoctor,
        clarification,
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
      "Agent routing check failed:",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    process.exitCode = 1;
  },
);