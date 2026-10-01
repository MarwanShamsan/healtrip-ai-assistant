import { config } from "dotenv";
import Groq from "groq-sdk";

config({
  path: ".env.local",
  override: true,
});

const apiKey = process.env["GROQ_API_KEY"];

if (!apiKey) {
  throw new Error("GROQ_API_KEY is missing.");
}

async function main() {
  const groq = new Groq({
    apiKey,
  });

  const models = await groq.models.list();

  console.log("Groq authentication passed.");
  console.log(
    `Available models returned: ${models.data.length}`,
  );
}

main().catch((error) => {
  console.error(
    "Groq authentication failed:",
    error instanceof Error
      ? error.message
      : "unknown_error",
  );

  process.exitCode = 1;
});