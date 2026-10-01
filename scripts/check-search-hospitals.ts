import assert from "node:assert/strict";
import { config } from "dotenv";

config({
  path: ".env.local",
  override: true,
});

async function main() {
  const { search_hospitals } = await import(
    "../lib/tools/search-hospitals"
  );

  const validSearch = await search_hospitals({
    city: "Riyadh",
    emergencyAvailable: true,
    limit: 5,
  });

  assert.equal(validSearch.ok, true);

  if (!validSearch.ok) {
    throw new Error(
      "Expected valid hospital search to succeed.",
    );
  }

  assert.equal(validSearch.data.length, 1);

  assert.equal(
    validSearch.data[0]?.id,
    "hosp_demo_riyadh_central",
  );

  const specialtySearch = await search_hospitals({
    city: "Jeddah",
    specialty: "Cardiology",
  });

  assert.equal(specialtySearch.ok, true);

  if (!specialtySearch.ok) {
    throw new Error(
      "Expected specialty hospital search to succeed.",
    );
  }

  assert.equal(specialtySearch.data.length, 1);

  assert.equal(
    specialtySearch.data[0]?.id,
    "hosp_demo_jeddah_coastal",
  );

  const invalidLimit = await search_hospitals({
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

  const unknownField = await search_hospitals({
    city: "Riyadh",
    arbitrarySql: "DROP TABLE Hospital",
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

  const noResults = await search_hospitals({
    city: "Riyadh",
    specialty: "Pediatrics",
  });

  assert.equal(noResults.ok, true);

  if (!noResults.ok) {
    throw new Error(
      "Expected no-results search to succeed.",
    );
  }

  assert.deepEqual(noResults.data, []);

  console.log("search_hospitals checks passed.");

  console.log(
    JSON.stringify(
      {
        validSearch,
        specialtySearch,
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
    "search_hospitals check failed:",
    error,
  );

  process.exitCode = 1;
});