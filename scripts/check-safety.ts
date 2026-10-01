import assert from "node:assert/strict";
import {
  chatRequestSchema,
} from "../lib/ai/schemas";
import {
  determineLocale,
  screenForUrgency,
} from "../lib/ai/safety";

function main() {
  const validRequest = chatRequestSchema.safeParse({
    message: "I need a cardiologist in Riyadh.",
    locale: "en",
    conversation: [],
  });

  assert.equal(validRequest.success, true);

  const emptyMessage = chatRequestSchema.safeParse({
    message: "   ",
    locale: "en",
    conversation: [],
  });

  assert.equal(emptyMessage.success, false);

  const oversizedMessage =
    chatRequestSchema.safeParse({
      message: "a".repeat(2001),
      locale: "en",
      conversation: [],
    });

  assert.equal(oversizedMessage.success, false);

  const oversizedConversation =
    chatRequestSchema.safeParse({
      message: "Hello",
      locale: "en",
      conversation: Array.from(
        { length: 21 },
        () => ({
          role: "user" as const,
          content: "Test",
        }),
      ),
    });

  assert.equal(
    oversizedConversation.success,
    false,
  );

  assert.equal(
    determineLocale(
      "I need a doctor in Riyadh.",
    ),
    "en",
  );

  assert.equal(
    determineLocale(
      "أحتاج إلى طبيب في الرياض",
    ),
    "ar",
  );

  const routineResult = screenForUrgency(
    "I need a cardiologist in Riyadh.",
    "en",
  );

  assert.deepEqual(routineResult, {
    status: "clear",
    locale: "en",
  });

  const urgentEnglish = screenForUrgency(
    "I have chest pain and difficulty breathing.",
    "en",
  );

  assert.equal(
    urgentEnglish.status,
    "urgent",
  );

  if (urgentEnglish.status !== "urgent") {
    throw new Error(
      "Expected urgent English safety result.",
    );
  }

  assert.equal(
    urgentEnglish.matchedRule,
    "chest_pain_with_breathing_difficulty",
  );

  const urgentArabic = screenForUrgency(
    "لدي ألم الصدر وصعوبة في التنفس",
    "ar",
  );

  assert.equal(
    urgentArabic.status,
    "urgent",
  );

  if (urgentArabic.status !== "urgent") {
    throw new Error(
      "Expected urgent Arabic safety result.",
    );
  }

  assert.equal(
    urgentArabic.locale,
    "ar",
  );

  const unknownField =
    chatRequestSchema.safeParse({
      message: "Hello",
      locale: "en",
      conversation: [],
      bypassSafety: true,
    });

  assert.equal(unknownField.success, false);

  console.log(
    "Safety and request validation checks passed.",
  );

  console.log(
    JSON.stringify(
      {
        validRequest: validRequest.success,
        emptyMessageRejected:
          !emptyMessage.success,
        oversizedMessageRejected:
          !oversizedMessage.success,
        oversizedConversationRejected:
          !oversizedConversation.success,
        unknownFieldRejected:
          !unknownField.success,
        routineResult,
        urgentEnglish,
        urgentArabic,
      },
      null,
      2,
    ),
  );
}

main();