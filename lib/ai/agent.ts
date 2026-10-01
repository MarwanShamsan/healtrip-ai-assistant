import {
  chatRequestSchema,
} from "./schemas";
import {
  screenForUrgency,
} from "./safety";
import type {
  AgentPreflightResult,
  AgentState,
} from "./types";

export function prepareAgentRequest(
  input: unknown,
): AgentPreflightResult {
  const parsed = chatRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_REQUEST",
      message: "The request is invalid.",
    };
  }

  const request = parsed.data;

  const safetyResult = screenForUrgency(
    request.message,
    request.locale,
  );

  const state: AgentState = {
    locale: safetyResult.locale,
    userMessage: request.message,
    conversation: request.conversation,
    safetyStatus: safetyResult.status,
    missingFields: [],
  };

  if (safetyResult.status === "urgent") {
    state.nextStep = "urgent";

    return {
      ok: true,
      stage: "complete",
      state,
      response: {
        action: "urgent",
        message: safetyResult.message,
      },
    };
  }

  return {
    ok: true,
    stage: "ready",
    state,
  };
}