import { getProviderDetails } from "../providers/provider-service";
import type { ProviderRecord } from "../providers/types";
import {
  getProviderDetailsInputSchema,
  providerRecordSchema,
} from "./schemas";
import type { ToolResult } from "./types";

export async function get_provider_details(
  input: unknown,
): Promise<ToolResult<ProviderRecord>> {
  const parsed = getProviderDetailsInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_TOOL_ARGUMENTS",
        message: "Invalid get_provider_details arguments.",
      },
    };
  }

  try {
    const provider = await getProviderDetails(parsed.data);

    if (!provider) {
      return {
        ok: false,
        error: {
          code: "PROVIDER_NOT_FOUND",
          message: "The requested demo provider was not found.",
        },
      };
    }

    const validatedProvider = providerRecordSchema.parse(provider);

    return {
      ok: true,
      data: validatedProvider,
    };
  } catch (error) {
    console.error("[tool:get_provider_details]", {
      category: "provider_lookup_failed",
      error:
        error instanceof Error
          ? error.message
          : "unknown_error",
    });

    return {
      ok: false,
      error: {
        code: "PROVIDER_SEARCH_UNAVAILABLE",
        message: "Provider details are temporarily unavailable.",
      },
    };
  }
}