import {
  extractContext,
} from "./context-extractor";

import {
  chatRequestSchema,
} from "./schemas";

import {
  screenForUrgency,
} from "./safety";

import {
  search_doctors,
  search_hospitals,
} from "../tools";

import type {
  ExtractedContext,
} from "./context-schema";

import type {
  AgentPreflightResult,
  AgentResponse,
  AgentRunResult,
  AgentState,
} from "./types";

function clarificationFallback(
  locale: "ar" | "en",
): string {
  if (locale === "ar") {
    return "هل يمكنك توضيح ما الذي تحتاج المساعدة بشأنه؟";
  }

  return "Could you clarify what you need help with?";
}

function providerUnavailableMessage(
  locale: "ar" | "en",
): string {
  if (locale === "ar") {
    return "البحث عن مقدمي الخدمة غير متاح مؤقتًا. يرجى المحاولة مرة أخرى لاحقًا.";
  }

  return "Provider search is temporarily unavailable. Please try again later.";
}

function noProvidersMessage(
  locale: "ar" | "en",
): string {
  if (locale === "ar") {
    return "لم أجد مقدمي خدمة تجريبيين مطابقين لهذه المعايير. يمكنك تعديل المدينة أو التخصص والمحاولة مرة أخرى.";
  }

  return "No matching demo providers were found. You can adjust the city or specialty and try again.";
}

function providersFoundMessage(
  locale: "ar" | "en",
): string {
  if (locale === "ar") {
    return "وجدت الخيارات التالية في قاعدة بيانات مقدمي الخدمة التجريبية.";
  }

  return "I found the following options in the demo provider database.";
}

function aiUnavailableMessage(
  locale?: "ar" | "en",
): string {
  if (locale === "ar") {
    return "المساعدة الذكية غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى بعد قليل.";
  }

  return "AI assistance is temporarily unavailable. Please try again shortly.";
}

export function prepareAgentRequest(
  input: unknown,
): AgentPreflightResult {
  const parsed =
    chatRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_REQUEST",
      message: "The request is invalid.",
    };
  }

  const {
    message,
    locale: requestedLocale,
    conversation,
  } = parsed.data;

  const safetyResult =
    screenForUrgency(
      message,
      requestedLocale,
    );

  const state: AgentState = {
    locale: safetyResult.locale,
    userMessage: message,
    conversation,
    safetyStatus:
      safetyResult.status,
    missingFields: [],
  };

  if (
    safetyResult.status === "urgent"
  ) {
    state.nextStep = "urgent";

    return {
      ok: true,
      stage: "complete",
      state,

      response: {
        action: "urgent",
        message:
          safetyResult.message,
      },
    };
  }

  return {
    ok: true,
    stage: "ready",
    state,
  };
}

async function routeExtractedContext(
  state: AgentState,
  context: ExtractedContext,
): Promise<{
  response: AgentResponse;

  toolUsed?:
    | "search_doctors"
    | "search_hospitals";
}> {
  state.intent =
    context.intent;

  state.specialty =
    context.specialty ??
    undefined;

  state.city =
    context.city ??
    undefined;

  state.providerType =
    context.providerType ??
    undefined;

  state.missingFields =
    context.missingFields;

  state.nextStep =
    context.nextStep;

  if (
    context.nextStep === "clarify"
  ) {
    return {
      response: {
        action: "clarify",

        message:
          context.clarificationQuestion ??
          clarificationFallback(
            state.locale,
          ),
      },
    };
  }

  if (
    context.nextStep ===
    "general_guidance"
  ) {
    return {
      response: {
        action: "guidance",

        message:
          context.guidanceMessage ??
          clarificationFallback(
            state.locale,
          ),
      },
    };
  }

  if (
    context.nextStep ===
    "doctor_search"
  ) {
    if (
      !context.specialty ||
      !context.city
    ) {
      return {
        response: {
          action: "clarify",

          message:
            state.locale === "ar"
              ? "ما التخصص والمدينة التي تريد البحث فيها؟"
              : "Which specialty and city would you like me to search?",
        },
      };
    }

    const result =
      await search_doctors({
        specialty:
          context.specialty,

        city:
          context.city,

        language:
          state.locale,

        limit: 5,
      });

    if (!result.ok) {
      return {
        response: {
          action: "guidance",

          message:
            providerUnavailableMessage(
              state.locale,
            ),
        },

        toolUsed:
          "search_doctors",
      };
    }

    state.toolResult =
      result.data;

    return {
      response: {
        action:
          "provider_results",

        message:
          result.data.length === 0
            ? noProvidersMessage(
                state.locale,
              )
            : providersFoundMessage(
                state.locale,
              ),

        providers:
          result.data,
      },

      toolUsed:
        "search_doctors",
    };
  }

  if (
    context.nextStep ===
    "hospital_search"
  ) {
    if (!context.city) {
      return {
        response: {
          action: "clarify",

          message:
            state.locale === "ar"
              ? "في أي مدينة تريد البحث عن مستشفى؟"
              : "Which city would you like me to search for a hospital in?",
        },
      };
    }

    const result =
      await search_hospitals({
        city:
          context.city,

        specialty:
          context.specialty ??
          undefined,

        limit: 5,
      });

    if (!result.ok) {
      return {
        response: {
          action: "guidance",

          message:
            providerUnavailableMessage(
              state.locale,
            ),
        },

        toolUsed:
          "search_hospitals",
      };
    }

    state.toolResult =
      result.data;

    return {
      response: {
        action:
          "provider_results",

        message:
          result.data.length === 0
            ? noProvidersMessage(
                state.locale,
              )
            : providersFoundMessage(
                state.locale,
              ),

        providers:
          result.data,
      },

      toolUsed:
        "search_hospitals",
    };
  }

  return {
    response: {
      action: "guidance",

      message:
        context.guidanceMessage ??
        clarificationFallback(
          state.locale,
        ),
    },
  };
}

export async function runAgent(
  input: unknown,
): Promise<AgentRunResult> {
  const preflight =
    prepareAgentRequest(input);

  if (!preflight.ok) {
    return preflight;
  }

  if (
    preflight.stage ===
    "complete"
  ) {
    return {
      ok: true,

      state:
        preflight.state,

      response:
        preflight.response,

      meta: {
        aiUsed: false,
      },
    };
  }

  try {
    const context =
      await extractContext(
        preflight.state,
      );

    const routed =
      await routeExtractedContext(
        preflight.state,
        context,
      );

    return {
      ok: true,

      state:
        preflight.state,

      response:
        routed.response,

      meta: {
        aiUsed: true,

        ...(routed.toolUsed
          ? {
              toolUsed:
                routed.toolUsed,
            }
          : {}),
      },
    };
  } catch (error) {
    console.error(
      "[agent]",
      {
        category:
          "ai_orchestration_failed",

        error:
          error instanceof Error
            ? error.message
            : "unknown_error",
      },
    );

    return {
      ok: false,

      code:
        "AI_UNAVAILABLE",

      message:
        aiUnavailableMessage(
          preflight.state.locale,
        ),
    };
  }
}