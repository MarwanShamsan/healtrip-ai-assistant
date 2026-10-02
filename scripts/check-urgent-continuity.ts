import assert from "node:assert/strict";

async function main() {
  const {
    runAgent,
  } = await import(
    "../lib/ai/agent"
  );

  const result =
    await runAgent({
      message:
        "recommend me a doctor",

      locale:
        "en",

      conversation: [
        {
          role:
            "user",

          content:
            "I cannot breathe",
        },

        {
          role:
            "assistant",

          content:
            "Please seek urgent in-person medical assessment.",

          action:
            "urgent",
        },
      ],
    });

  assert.equal(
    result.ok,
    true,
  );

  if (!result.ok) {
    throw new Error(
      "Urgent continuity failed.",
    );
  }

  assert.equal(
    result.response.action,
    "urgent",
  );

  assert.equal(
    result.meta.aiUsed,
    false,
  );

  assert.equal(
    result.meta.toolUsed,
    undefined,
  );

  console.log(
    "Urgent continuity check passed.",
  );

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  );
}

main().catch(
  (error) => {
    console.error(
      "Urgent continuity check failed:",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    process.exitCode =
      1;
  },
);