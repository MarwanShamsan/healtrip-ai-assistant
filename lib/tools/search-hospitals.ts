import { findHospitals } from "../providers/provider-service";
import type { HospitalProvider } from "../providers/types";
import {
  hospitalProviderSchema,
  searchHospitalsInputSchema,
} from "./schemas";
import type { ToolResult } from "./types";

export async function search_hospitals(
  input: unknown,
): Promise<ToolResult<HospitalProvider[]>> {
  const parsed = searchHospitalsInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_TOOL_ARGUMENTS",
        message: "Invalid search_hospitals arguments.",
      },
    };
  }

  try {
    const hospitals = await findHospitals(parsed.data);

    const validatedHospitals = hospitals.map((hospital) =>
      hospitalProviderSchema.parse(hospital),
    );

    return {
      ok: true,
      data: validatedHospitals,
    };
  } catch (error) {
    console.error("[tool:search_hospitals]", {
      category: "provider_search_failed",
      error:
        error instanceof Error
          ? error.message
          : "unknown_error",
    });

    return {
      ok: false,
      error: {
        code: "PROVIDER_SEARCH_UNAVAILABLE",
        message: "Provider search is temporarily unavailable.",
      },
    };
  }
}