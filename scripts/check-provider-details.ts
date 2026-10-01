import assert from "node:assert/strict";
import { config } from "dotenv";

config({
  path: ".env.local",
  override: true,
});

async function main() {
  const { get_provider_details } = await import(
    "../lib/tools/get-provider-details"
  );

  const doctorResult = await get_provider_details({
    providerType: "doctor",
    providerId: "doc_demo_riyadh_card_01",
  });

  assert.equal(doctorResult.ok, true);

  if (!doctorResult.ok) {
    throw new Error(
      "Expected doctor provider lookup to succeed.",
    );
  }

  assert.equal(
    doctorResult.data.providerType,
    "doctor",
  );

  assert.equal(
    doctorResult.data.id,
    "doc_demo_riyadh_card_01",
  );

  const hospitalResult = await get_provider_details({
    providerType: "hospital",
    providerId: "hosp_demo_jeddah_coastal",
  });

  assert.equal(hospitalResult.ok, true);

  if (!hospitalResult.ok) {
    throw new Error(
      "Expected hospital provider lookup to succeed.",
    );
  }

  assert.equal(
    hospitalResult.data.providerType,
    "hospital",
  );

  assert.equal(
    hospitalResult.data.id,
    "hosp_demo_jeddah_coastal",
  );

  const invalidType = await get_provider_details({
    providerType: "clinic",
    providerId: "abc",
  });

  assert.equal(invalidType.ok, false);

  if (invalidType.ok) {
    throw new Error(
      "Expected invalid provider type to be rejected.",
    );
  }

  assert.equal(
    invalidType.error.code,
    "INVALID_TOOL_ARGUMENTS",
  );

  const missingProvider = await get_provider_details({
    providerType: "doctor",
    providerId: "doc_does_not_exist",
  });

  assert.equal(missingProvider.ok, false);

  if (missingProvider.ok) {
    throw new Error(
      "Expected missing provider lookup to fail.",
    );
  }

  assert.equal(
    missingProvider.error.code,
    "PROVIDER_NOT_FOUND",
  );

  console.log("get_provider_details checks passed.");

  console.log(
    JSON.stringify(
      {
        doctorResult,
        hospitalResult,
        invalidType,
        missingProvider,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    "get_provider_details check failed:",
    error,
  );

  process.exitCode = 1;
});