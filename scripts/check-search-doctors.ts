import assert from "node:assert/strict";
import { config } from "dotenv";

config({
  path: ".env.local",
  override: true,
});

async function main() {
  const { search_doctors } = await import(
    "../lib/tools/search-doctors"
  );

  const validSearch = await search_doctors({
    specialty: "Cardiology",
    city: "Riyadh",
    language: "ar",
    limit: 5,
  });

  assert.equal(validSearch.ok, true);

  if (!validSearch.ok) {
    throw new Error(
      "Expected valid doctor search to succeed.",
    );
  }

  assert.equal(validSearch.data.length, 1);

  assert.equal(
    validSearch.data[0]?.id,
    "doc_demo_riyadh_card_01",
  );

  const invalidLimit = await search_doctors({
    city: "Riyadh",
    limit: 999,
  });

  assert.equal(invalidLimit.ok, false);

  if (invalidLimit.ok) {
    throw new Error(
      "Expected invalid limit to be rejected.",
    );
  }

  assert.equal(
    invalidLimit.error.code,
    "INVALID_TOOL_ARGUMENTS",
  );

  const unknownField = await search_doctors({
    city: "Riyadh",
    deleteDatabase: true,
  });

  assert.equal(unknownField.ok, false);

  if (unknownField.ok) {
    throw new Error(
      "Expected unknown field to be rejected.",
    );
  }

  assert.equal(
    unknownField.error.code,
    "INVALID_TOOL_ARGUMENTS",
  );

  const noResults = await search_doctors({
    specialty: "Pediatrics",
    city: "Riyadh",
  });

  assert.equal(noResults.ok, true);

  if (!noResults.ok) {
    throw new Error(
      "Expected no-results search to succeed.",
    );
  }

  assert.deepEqual(noResults.data, []);

  console.log("search_doctors checks passed.");

  console.log(
    JSON.stringify(
      {
        validSearch,
        invalidLimit,
        unknownField,
        noResults,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    "search_doctors check failed:",
    error,
  );

  process.exitCode = 1;
});