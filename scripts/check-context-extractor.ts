import assert from "node:assert/strict";
import { config } from "dotenv";

config({
  path: ".env.local",
  override: true,
});

async function main() {
  const {
    prepareAgentRequest,
  } = await import("../lib/ai/agent");

  const {
    extractContext,
  } = await import(
    "../lib/ai/context-extractor"
  );

  const englishPreflight =
    prepareAgentRequest({
      message:
        "I need a cardiologist in Riyadh.",
      locale: "en",
      conversation: [],
    });

  assert.equal(
    englishPreflight.ok,
    true,
  );

  if (
    !englishPreflight.ok ||
    englishPreflight.stage !== "ready"
  ) {
    throw new Error(
      "English request did not reach AI stage.",
    );
  }

  const englishContext =
    await extractContext(
      englishPreflight.state,
    );

  assert.equal(
    englishContext.specialty,
    "Cardiology",
  );

  assert.equal(
    englishContext.city,
    "Riyadh",
  );

  assert.equal(
    englishContext.nextStep,
    "doctor_search",
  );

  const arabicPreflight =
    prepareAgentRequest({
      message:
        "أحتاج طبيب قلب في الرياض",
      locale: "ar",
      conversation: [],
    });

  assert.equal(
    arabicPreflight.ok,
    true,
  );

  if (
    !arabicPreflight.ok ||
    arabicPreflight.stage !== "ready"
  ) {
    throw new Error(
      "Arabic request did not reach AI stage.",
    );
  }

  const arabicContext =
    await extractContext(
      arabicPreflight.state,
    );

  assert.equal(
    arabicContext.specialty,
    "Cardiology",
  );

  assert.equal(
    arabicContext.city,
    "Riyadh",
  );

  assert.equal(
    arabicContext.nextStep,
    "doctor_search",
  );

  const clarificationPreflight =
    prepareAgentRequest({
      message:
        "I need a cardiologist.",
      locale: "en",
      conversation: [],
    });

  if (
    !clarificationPreflight.ok ||
    clarificationPreflight.stage !== "ready"
  ) {
    throw new Error(
      "Clarification request did not reach AI stage.",
    );
  }

  const clarificationContext =
    await extractContext(
      clarificationPreflight.state,
    );

  assert.equal(
    clarificationContext.nextStep,
    "clarify",
  );

  assert.ok(
    clarificationContext.missingFields.includes(
      "city",
    ),
  );

  assert.ok(
    clarificationContext.clarificationQuestion,
  );

  const symptomPreflight =
    prepareAgentRequest({
      message:
        "I've had headaches for several days and I'm not sure what I should do.",
      locale: "en",
      conversation: [],
    });

  if (
    !symptomPreflight.ok ||
    symptomPreflight.stage !== "ready"
  ) {
    throw new Error(
      "Symptom request did not reach AI stage.",
    );
  }

  const symptomContext =
    await extractContext(
      symptomPreflight.state,
    );

  assert.equal(
    symptomContext.intent,
    "symptom_guidance",
  );

  console.log(
    "Bilingual AI context extraction checks passed.",
  );

  console.log(
    JSON.stringify(
      {
        englishContext,
        arabicContext,
        clarificationContext,
        symptomContext,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    "AI context extraction check failed:",
    error instanceof Error
      ? error.message
      : "unknown_error",
  );

  process.exitCode = 1;
});