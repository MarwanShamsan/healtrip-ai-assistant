import assert from "node:assert/strict";

import {
  screenForUrgency,
} from "../lib/ai/safety";

function main() {
  const chestPain =
    screenForUrgency(
      "I have chest pain.",
      "en",
    );

  assert.equal(
    chestPain.status,
    "urgent",
  );

  const chestPainTypo =
    screenForUrgency(
      "yes a chest pan",
      "en",
    );

  assert.equal(
    chestPainTypo.status,
    "urgent",
  );

  const chestAndBreathing =
    screenForUrgency(
      "I have chest pain and difficulty breathing.",
      "en",
    );

  assert.equal(
    chestAndBreathing.status,
    "urgent",
  );

  if (
    chestAndBreathing.status ===
    "urgent"
  ) {
    assert.equal(
      chestAndBreathing.matchedRule,
      "chest_pain_with_breathing_difficulty",
    );
  }

  /*
   * Critical regression:
   *
   * Explicitly denying chest pain must
   * NOT trigger the chest-pain rule.
   */
  const deniesChestPain =
    screenForUrgency(
      "I don't have chest pain.",
      "en",
    );

  assert.equal(
    deniesChestPain.status,
    "clear",
  );

  const deniesMultipleSymptoms =
    screenForUrgency(
      "I don't have chest pain, trouble breathing, dizziness, or fainting.",
      "en",
    );

  assert.equal(
    deniesMultipleSymptoms.status,
    "clear",
  );

  /*
   * A previous negative must not hide a
   * later affirmative symptom.
   */
  const negativeThenPositive =
    screenForUrgency(
      "I didn't have chest pain earlier, but now I have chest pain.",
      "en",
    );

  assert.equal(
    negativeThenPositive.status,
    "urgent",
  );

  const arabicChestPain =
    screenForUrgency(
      "لدي ألم في الصدر",
      "ar",
    );

  assert.equal(
    arabicChestPain.status,
    "urgent",
  );

  const arabicDenial =
    screenForUrgency(
      "لا أعاني من ألم في الصدر",
      "ar",
    );

  assert.equal(
    arabicDenial.status,
    "clear",
  );

  const routine =
    screenForUrgency(
      "I need a cardiologist in Riyadh.",
      "en",
    );

  assert.equal(
    routine.status,
    "clear",
  );

  const headache =
    screenForUrgency(
      "I have a headache.",
      "en",
    );

  assert.equal(
    headache.status,
    "clear",
  );

  console.log(
    "Safety hardening checks passed.",
  );

  console.log(
    JSON.stringify(
      {
        chestPain,
        chestPainTypo,
        chestAndBreathing,
        deniesChestPain,
        deniesMultipleSymptoms,
        negativeThenPositive,
        arabicChestPain,
        arabicDenial,
        routine,
        headache,
      },
      null,
      2,
    ),
  );
}

main();