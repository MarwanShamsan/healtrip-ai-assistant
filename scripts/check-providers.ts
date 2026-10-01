import assert from "node:assert/strict";
import { config } from "dotenv";

config({
  path: ".env.local",
  override: true,
});

async function main() {
  const [
    {
      findDoctors,
      findHospitals,
      getProviderDetails,
    },
    { default: prisma },
  ] = await Promise.all([
    import("../lib/providers/provider-service"),
    import("../lib/db/prisma"),
  ]);

  try {
    const riyadhCardiologists = await findDoctors({
      specialty: "Cardiology",
      city: "Riyadh",
    });

    assert.equal(
      riyadhCardiologists.length,
      1,
      "Expected one demo cardiologist in Riyadh.",
    );

    assert.equal(
      riyadhCardiologists[0]?.id,
      "doc_demo_riyadh_card_01",
    );

    const arabicCardiologists = await findDoctors({
      specialty: "Cardiology",
      language: "ar",
    });

    assert.equal(
      arabicCardiologists.length,
      3,
      "Expected three Arabic-speaking demo cardiologists.",
    );

    const riyadhEmergencyHospitals = await findHospitals({
      city: "Riyadh",
      emergencyAvailable: true,
    });

    assert.equal(
      riyadhEmergencyHospitals.length,
      1,
      "Expected one emergency-enabled demo hospital in Riyadh.",
    );

    assert.equal(
      riyadhEmergencyHospitals[0]?.id,
      "hosp_demo_riyadh_central",
    );

    const jeddahCardiologyHospitals =
      await findHospitals({
        city: "Jeddah",
        specialty: "Cardiology",
      });

    assert.equal(
      jeddahCardiologyHospitals.length,
      1,
      "Expected one Jeddah hospital with a demo cardiologist.",
    );

    const doctor = await getProviderDetails({
      providerType: "doctor",
      providerId: "doc_demo_dammam_card_01",
    });

    assert.ok(
      doctor,
      "Expected demo doctor details.",
    );

    assert.equal(
      doctor.providerType,
      "doctor",
    );

    const hospital = await getProviderDetails({
      providerType: "hospital",
      providerId: "hosp_demo_jeddah_coastal",
    });

    assert.ok(
      hospital,
      "Expected demo hospital details.",
    );

    assert.equal(
      hospital.providerType,
      "hospital",
    );

    const noResults = await findDoctors({
      specialty: "Pediatrics",
      city: "Riyadh",
    });

    assert.deepEqual(
      noResults,
      [],
      "Expected an empty result instead of invented providers.",
    );

    console.log("Provider service checks passed.");

    console.log(
      JSON.stringify(
        {
          riyadhCardiologists,
          arabicCardiologists,
          riyadhEmergencyHospitals,
          jeddahCardiologyHospitals,
          doctor,
          hospital,
          noResults,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    "Provider service check failed:",
    error,
  );

  process.exitCode = 1;
});