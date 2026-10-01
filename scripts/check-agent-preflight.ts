import assert from "node:assert/strict";
import {
  prepareAgentRequest,
} from "../lib/ai/agent";

function main() {
  const routineEnglish = prepareAgentRequest({
    message: "I need a cardiologist in Riyadh.",
    locale: "en",
    conversation: [],
  });

  assert.equal(routineEnglish.ok, true);

  if (!routineEnglish.ok) {
    throw new Error(
      "Expected routine request to be valid.",
    );
  }

  assert.equal(
    routineEnglish.stage,
    "ready",
  );

  assert.equal(
    routineEnglish.state.safetyStatus,
    "clear",
  );

  assert.equal(
    routineEnglish.state.locale,
    "en",
  );

  const inferredArabic = prepareAgentRequest({
    message: "أحتاج إلى طبيب في الرياض",
    conversation: [],
  });

  assert.equal(inferredArabic.ok, true);

  if (!inferredArabic.ok) {
    throw new Error(
      "Expected Arabic request to be valid.",
    );
  }

  assert.equal(
    inferredArabic.state.locale,
    "ar",
  );

  const urgentEnglish = prepareAgentRequest({
    message:
      "I have chest pain and difficulty breathing.",
    locale: "en",
    conversation: [],
  });

  assert.equal(urgentEnglish.ok, true);

  if (!urgentEnglish.ok) {
    throw new Error(
      "Expected urgent request to be valid.",
    );
  }

  assert.equal(
    urgentEnglish.stage,
    "complete",
  );

  assert.equal(
    urgentEnglish.state.nextStep,
    "urgent",
  );

  assert.equal(
    urgentEnglish.state.safetyStatus,
    "urgent",
  );

  if (urgentEnglish.stage !== "complete") {
    throw new Error(
      "Expected urgent request to finish during preflight.",
    );
  }

  assert.equal(
    urgentEnglish.response.action,
    "urgent",
  );

  const urgentArabic = prepareAgentRequest({
    message:
      "لدي ألم الصدر وصعوبة في التنفس",
    locale: "ar",
    conversation: [],
  });

  assert.equal(urgentArabic.ok, true);

  if (!urgentArabic.ok) {
    throw new Error(
      "Expected urgent Arabic request to be valid.",
    );
  }

  assert.equal(
    urgentArabic.stage,
    "complete",
  );

  const invalidRequest = prepareAgentRequest({
    message: "",
    locale: "en",
    conversation: [],
  });

  assert.equal(
    invalidRequest.ok,
    false,
  );

  if (invalidRequest.ok) {
    throw new Error(
      "Expected empty request to fail validation.",
    );
  }

  assert.equal(
    invalidRequest.code,
    "INVALID_REQUEST",
  );

  const bypassAttempt = prepareAgentRequest({
    message:
      "I have chest pain and difficulty breathing.",
    locale: "en",
    conversation: [],
    bypassSafety: true,
  });

  assert.equal(
    bypassAttempt.ok,
    false,
  );

  console.log(
    "Agent preflight checks passed.",
  );

  console.log(
    JSON.stringify(
      {
        routineEnglish,
        inferredArabic,
        urgentEnglish,
        urgentArabic,
        invalidRequest,
        bypassAttempt,
      },
      null,
      2,
    ),
  );
}

main();