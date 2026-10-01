import assert from "node:assert/strict";
import { config } from "dotenv";

config({
  path: ".env.local",
  override: true,
});

async function main() {
  const {
    providerTools,
    search_doctors,
    search_hospitals,
    get_provider_details,
  } = await import("../lib/tools");

  assert.deepEqual(
    Object.keys(providerTools).sort(),
    [
      "get_provider_details",
      "search_doctors",
      "search_hospitals",
    ].sort(),
  );

  const doctorSearch = await search_doctors({
    specialty: "Cardiology",
    city: "Riyadh",
    language: "ar",
    limit: 5,
  });

  assert.equal(doctorSearch.ok, true);

  const hospitalSearch = await search_hospitals({
    city: "Jeddah",
    emergencyAvailable: true,
  });

  assert.equal(hospitalSearch.ok, true);

  const providerDetails = await get_provider_details({
    providerType: "doctor",
    providerId: "doc_demo_dammam_card_01",
  });

  assert.equal(providerDetails.ok, true);

  const invalidDoctorArgs = await search_doctors({
    city: "Riyadh",
    limit: 999,
  });

  assert.equal(invalidDoctorArgs.ok, false);

  const missingProvider = await get_provider_details({
    providerType: "doctor",
    providerId: "doc_does_not_exist",
  });

  assert.equal(missingProvider.ok, false);

  console.log("All provider tool checks passed.");

  console.log(
    JSON.stringify(
      {
        toolNames: Object.keys(providerTools),
        doctorSearch,
        hospitalSearch,
        providerDetails,
        invalidDoctorArgs,
        missingProvider,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    "Combined tool check failed:",
    error,
  );

  process.exitCode = 1;
});