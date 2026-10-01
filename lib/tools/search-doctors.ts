import { findDoctors } from "../providers/provider-service";
import type { DoctorProvider } from "../providers/types";
import {
  doctorProviderSchema,
  searchDoctorsInputSchema,
} from "./schemas";
import type { ToolResult } from "./types";

export async function search_doctors(
  input: unknown,
): Promise<ToolResult<DoctorProvider[]>> {
  const parsed = searchDoctorsInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_TOOL_ARGUMENTS",
        message: "Invalid search_doctors arguments.",
      },
    };
  }

  try {
    const doctors = await findDoctors(parsed.data);

    const validatedDoctors = doctors.map((doctor) =>
      doctorProviderSchema.parse(doctor),
    );

    return {
      ok: true,
      data: validatedDoctors,
    };
  } catch (error) {
    console.error("[tool:search_doctors]", {
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