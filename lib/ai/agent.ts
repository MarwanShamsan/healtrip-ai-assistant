import {
  assessClinicalContext,
} from "./clinical-assessor";

import {
  createInitialConversationState,
  type ConversationState,
  type ResponseLanguage,
} from "./conversation-state";

import {
  routeConversation,
} from "./conversation-router";

import {
  chatRequestSchema,
} from "./schemas";

import {
  determineLocale,
  screenForUrgency,
} from "./safety";

import {
  search_doctors,
  search_hospitals,
} from "../tools";

import type {
  ClinicalAssessment,
} from "./clinical-assessment-schema";

import type {
  AgentResponse,
  AgentRunResult,
  AgentState,
} from "./types";

function isUrgentState(
  state: ConversationState,
): boolean {
  return (
    state.phase ===
      "urgent_care" ||
    state.careRecommendation ===
      "urgent_in_person"
  );
}

function providerUnavailableMessage(
  language: ResponseLanguage,
): string {
  if (language === "ar") {
    return "البحث عن مقدمي الخدمة غير متاح مؤقتًا. لا يمكنني إنشاء معلومات عن مقدمي الخدمة من عندي. يرجى المحاولة مرة أخرى.";
  }

  return "Provider search is temporarily unavailable. I cannot invent provider information. Please try again.";
}

function noProvidersMessage(
  language: ResponseLanguage,
): string {
  if (language === "ar") {
    return "لم أجد مقدمي خدمة تجريبيين مطابقين لهذا البحث في قاعدة البيانات الحالية.";
  }

  return "I did not find matching demo providers for this search in the current database.";
}

function noMoreProvidersMessage(
  language: ResponseLanguage,
): string {
  if (language === "ar") {
    return "لا توجد نتائج تجريبية إضافية مطابقة لهذا البحث في قاعدة البيانات الحالية.";
  }

  return "There are no additional matching demo providers in the current database.";
}

function doctorsFoundMessage(
  language: ResponseLanguage,
): string {
  if (language === "ar") {
    return "وجدت خيارات أطباء مطابقة في قاعدة بيانات HealTrip التجريبية.";
  }

  return "I found matching doctor options in the HealTrip demo provider database.";
}

function hospitalsFoundMessage(
  language: ResponseLanguage,
  urgent: boolean,
): string {
  if (urgent) {
    if (language === "ar") {
      return "وجدت منشآت تجريبية في قاعدة البيانات تشير بياناتها إلى توفر خدمات طوارئ. لا تؤخر طلب الرعاية العاجلة أثناء البحث.";
    }

    return "I found demo facilities whose database records indicate emergency services are available. Do not delay urgent care while searching.";
  }

  if (language === "ar") {
    return "وجدت خيارات مستشفيات مطابقة في قاعدة بيانات HealTrip التجريبية.";
  }

  return "I found matching hospital options in the HealTrip demo provider database.";
}

function askCityMessage(
  language: ResponseLanguage,
  urgent: boolean,
  specialty?: string | null,
): string {
  if (urgent) {
    if (language === "ar") {
      return "أريد مساعدتك في الوصول إلى منشأة قادرة على التعامل مع الحالات الطارئة. في أي مدينة أنت الآن؟";
    }

    return "I want to help you find an emergency-capable facility. Which city are you in now?";
  }

  if (
    specialty ===
    "General Medicine"
  ) {
    if (language === "ar") {
      return "سأبدأ بالبحث عن طبيب طب عام كخيار مناسب للتوجيه. في أي مدينة أنت؟";
    }

    return "I'll start with a General Medicine doctor as the navigation option. Which city are you in?";
  }

  if (language === "ar") {
    return "في أي مدينة أنت حتى أتمكن من البحث في قاعدة بيانات مقدمي الخدمة؟";
  }

  return "Which city are you in so I can search the provider database?";
}

function askCityWithinCountryMessage(
  language: ResponseLanguage,
  country: string,
  urgent: boolean,
): string {
  if (urgent) {
    if (language === "ar") {
      return `فهمت أنك في ${country}. أحتاج إلى المدينة حتى أتمكن من البحث عن منشأة تجريبية تتوفر فيها خدمات طوارئ. في أي مدينة أنت؟`;
    }

    return `I understand that you're in ${country}. I need the city so I can search for an emergency-capable demo facility. Which city are you in?`;
  }

  if (language === "ar") {
    return `فهمت أنك في ${country}. في أي مدينة أنت حتى أتمكن من البحث في قاعدة بيانات مقدمي الخدمة؟`;
  }

  return `I understand that you're in ${country}. Which city are you in so I can search the provider database?`;
}

function askSpecialtyMessage(
  language: ResponseLanguage,
): string {
  if (language === "ar") {
    return "هل تريد تخصصًا معينًا، أم أبحث لك عن طبيب طب عام؟";
  }

  return "Would you like a specific specialty, or should I search for a General Medicine doctor?";
}

function urgentRecommendationMessage(
  language: ResponseLanguage,
): string {
  if (language === "ar") {
    return "بناءً على الأعراض العاجلة المذكورة، أوصي بالتقييم الطبي العاجل شخصيًا. أستطيع البحث في قاعدة بيانات HealTrip عن منشأة تجريبية تتوفر فيها خدمات طوارئ. في أي مدينة أنت؟";
  }

  return "Based on the urgent symptoms reported, I recommend urgent in-person medical assessment. I can search the HealTrip demo database for an emergency-capable facility. Which city are you in?";
}

function providerNavigationMessage(
  language: ResponseLanguage,
): string {
  if (language === "ar") {
    return "لمساعدتك في اتخاذ الخطوة التالية، سأبحث لك عن طبيب طب عام في قاعدة بيانات HealTrip. في أي مدينة أنت؟";
  }

  return "To help you take the next step, I'll look for a General Medicine doctor in the HealTrip provider database. Which city are you in?";
}

function combineMessages(
  first: string,
  second: string,
): string {
  return `${first.trim()}\n\n${second.trim()}`;
}

function recommendationFallback(
  state: ConversationState,
): string {
  if (
    state.lastRecommendationMessage
  ) {
    return state
      .lastRecommendationMessage;
  }

  if (
    state.responseLanguage ===
    "ar"
  ) {
    if (
      state.careRecommendation ===
      "see_doctor_soon"
    ) {
      return "أوصي بمراجعة طبيب قريبًا.";
    }

    if (
      state.careRecommendation ===
      "see_doctor_routine"
    ) {
      return "أوصي بترتيب تقييم طبي.";
    }

    if (
      state.careRecommendation ===
      "monitor_and_self_care"
    ) {
      return "بناءً على المعلومات الحالية، يمكن متابعة الأعراض، ويمكنني أيضًا مساعدتك في العثور على طبيب طب عام.";
    }

    return "يمكنني مساعدتك في الوصول إلى مقدم رعاية مناسب.";
  }

  if (
    state.careRecommendation ===
    "see_doctor_soon"
  ) {
    return "I recommend seeing a doctor soon.";
  }

  if (
    state.careRecommendation ===
    "see_doctor_routine"
  ) {
    return "I recommend arranging a medical evaluation.";
  }

  if (
    state.careRecommendation ===
    "monitor_and_self_care"
  ) {
    return "Based on the current information, monitoring may be reasonable, and I can also help you find a General Medicine doctor.";
  }

  return "I can help guide you toward an appropriate provider.";
}

function noEmergencyFacilityMessage(
  language: ResponseLanguage,
  city: string,
): string {
  if (language === "ar") {
    return `لم أجد منشأة طوارئ تجريبية مطابقة في ${city} داخل قاعدة البيانات الحالية. لا يمكنني إنشاء اسم مستشفى غير موجود في البيانات. لا تؤخر طلب الرعاية العاجلة بسبب ذلك.`;
  }

  return `I did not find a matching demo emergency facility in ${city} in the current database. I cannot invent a hospital that is not in the data. Do not delay urgent care because of this.`;
}

function syncCompatibilityFields(
  state: AgentState,
): void {
  state.urgentContextActive =
    isUrgentState(
      state.conversationState,
    );

  state.previousCareRecommendation =
    state.conversationState
      .careRecommendation;

  state.city =
    state.conversationState.city ??
    undefined;

  state.specialty =
    state.conversationState
      .specialty ??
    undefined;

  state.providerType =
    state.conversationState
      .providerType ??
    undefined;
}

function applyClinicalAssessment(
  state: AgentState,
  assessment: ClinicalAssessment,
): AgentResponse {
  state.clinicalAssessment =
    assessment;

  state.locale =
    assessment.responseLanguage;

  if (
    !assessment.assessmentComplete ||
    assessment.careRecommendation ===
      "continue_assessment"
  ) {
    state.conversationState = {
      ...state.conversationState,

      phase:
        "clinical_intake",

      responseLanguage:
        assessment.responseLanguage,

      careRecommendation:
        null,

      providerType:
        null,

      specialty:
        null,

      awaiting:
        null,

      lastSearch:
        null,

      lastClinicalSummary:
        assessment.assessmentSummary,

      lastRecommendationRationale:
        assessment.recommendationRationale,

      lastRecommendationMessage:
        null,
    };

    syncCompatibilityFields(
      state,
    );

    return {
      action:
        "clarify",

      message:
        assessment.nextQuestion ??
        (
          assessment.responseLanguage ===
          "ar"
            ? "هل يمكنك إخباري بمزيد من التفاصيل عن الأعراض؟"
            : "Could you tell me a little more about your symptoms?"
        ),
    };
  }

  if (
    assessment.careRecommendation ===
    "urgent_in_person"
  ) {
    state.safetyStatus =
      "urgent";

    state.conversationState = {
      ...state.conversationState,

      phase:
        "urgent_care",

      responseLanguage:
        assessment.responseLanguage,

      careRecommendation:
        "urgent_in_person",

      providerType:
        "hospital",

      specialty:
        null,

      city:
        null,

      awaiting:
        "city",

      lastSearch:
        null,

      lastClinicalSummary:
        assessment.assessmentSummary,

      lastRecommendationRationale:
        assessment.recommendationRationale,

      lastRecommendationMessage:
        assessment.recommendationMessage,
    };

    syncCompatibilityFields(
      state,
    );

    const recommendation =
      assessment.recommendationMessage ??
      (
        assessment.responseLanguage ===
        "ar"
          ? "أوصي بالتقييم الطبي العاجل شخصيًا."
          : "I recommend urgent in-person medical assessment."
      );

    return {
      action:
        "urgent",

      message:
        combineMessages(
          recommendation,
          askCityMessage(
            assessment.responseLanguage,
            true,
          ),
        ),
    };
  }

  state.conversationState = {
    ...state.conversationState,

    phase:
      "awaiting_city",

    responseLanguage:
      assessment.responseLanguage,

    careRecommendation:
      assessment.careRecommendation,

    providerType:
      "doctor",

    specialty:
      "General Medicine",

    city:
      null,

    awaiting:
      "city",

    lastSearch:
      null,

    lastClinicalSummary:
      assessment.assessmentSummary,

    lastRecommendationRationale:
      assessment.recommendationRationale,

    lastRecommendationMessage:
      assessment.recommendationMessage,
  };

  syncCompatibilityFields(
    state,
  );

  const recommendation =
    assessment.recommendationMessage ??
    recommendationFallback(
      state.conversationState,
    );

  return {
    action:
      "clarify",

    message:
      combineMessages(
        recommendation,
        providerNavigationMessage(
          assessment.responseLanguage,
        ),
      ),
  };
}

async function searchDoctors(
  state: AgentState,
  city: string,
  specialty:
    | "Cardiology"
    | "General Medicine"
    | "Neurology"
    | "Orthopedics"
    | "Dermatology"
    | "ENT",
  moreResults = false,
): Promise<{
  response:
    AgentResponse;

  toolUsed:
    "search_doctors";
}> {
  const result =
    await search_doctors({
      city,

      specialty,

      language:
        state.conversationState
          .responseLanguage,

      limit:
        5,
    });

  if (!result.ok) {
    return {
      response: {
        action:
          "guidance",

        message:
          providerUnavailableMessage(
            state.conversationState
              .responseLanguage,
          ),
      },

      toolUsed:
        "search_doctors",
    };
  }

  const previousIds =
    moreResults &&
    state.conversationState
      .lastSearch
      ?.providerType ===
      "doctor"
      ? new Set(
          state.conversationState
            .lastSearch
            .shownProviderIds,
        )
      : new Set<string>();

  const providers =
    result.data.filter(
      (provider) =>
        !previousIds.has(
          provider.id,
        ),
    );

  if (
    moreResults &&
    providers.length ===
      0
  ) {
    return {
      response: {
        action:
          "guidance",

        message:
          noMoreProvidersMessage(
            state.conversationState
              .responseLanguage,
          ),
      },

      toolUsed:
        "search_doctors",
    };
  }

  if (
    result.data.length ===
    0
  ) {
    return {
      response: {
        action:
          "guidance",

        message:
          noProvidersMessage(
            state.conversationState
              .responseLanguage,
          ),
      },

      toolUsed:
        "search_doctors",
    };
  }

  const visibleProviders =
    moreResults
      ? providers
      : result.data;

  const shownProviderIds =
    Array.from(
      new Set([
        ...previousIds,

        ...visibleProviders.map(
          (provider) =>
            provider.id,
        ),
      ]),
    );

  state.conversationState = {
    ...state.conversationState,

    phase:
      "provider_results",

    providerType:
      "doctor",

    specialty,

    city,

    awaiting:
      null,

    lastSearch: {
      providerType:
        "doctor",

      city,

      specialty,

      emergencyAvailable:
        null,

      shownProviderIds,
    },
  };

  state.toolResult =
    visibleProviders;

  syncCompatibilityFields(
    state,
  );

  return {
    response: {
      action:
        "provider_results",

      message:
        doctorsFoundMessage(
          state.conversationState
            .responseLanguage,
        ),

      providers:
        visibleProviders,
    },

    toolUsed:
      "search_doctors",
  };
}

async function searchHospitals(
  state: AgentState,
  city: string,
  emergencyAvailable: boolean,
  moreResults = false,
): Promise<{
  response:
    AgentResponse;

  toolUsed:
    "search_hospitals";
}> {
  const result =
    await search_hospitals({
      city,

      emergencyAvailable:
        emergencyAvailable
          ? true
          : undefined,

      limit:
        5,
    });

  if (!result.ok) {
    return {
      response: {
        action:
          emergencyAvailable
            ? "urgent"
            : "guidance",

        message:
          providerUnavailableMessage(
            state.conversationState
              .responseLanguage,
          ),
      },

      toolUsed:
        "search_hospitals",
    };
  }

  const previousIds =
    moreResults &&
    state.conversationState
      .lastSearch
      ?.providerType ===
      "hospital"
      ? new Set(
          state.conversationState
            .lastSearch
            .shownProviderIds,
        )
      : new Set<string>();

  const providers =
    result.data.filter(
      (provider) =>
        !previousIds.has(
          provider.id,
        ),
    );

  if (
    moreResults &&
    providers.length ===
      0
  ) {
    return {
      response: {
        action:
          emergencyAvailable
            ? "urgent"
            : "guidance",

        message:
          noMoreProvidersMessage(
            state.conversationState
              .responseLanguage,
          ),
      },

      toolUsed:
        "search_hospitals",
    };
  }

  if (
    result.data.length ===
    0
  ) {
    return {
      response: {
        action:
          emergencyAvailable
            ? "urgent"
            : "guidance",

        message:
          emergencyAvailable
            ? noEmergencyFacilityMessage(
                state.conversationState
                  .responseLanguage,
                city,
              )
            : noProvidersMessage(
                state.conversationState
                  .responseLanguage,
              ),
      },

      toolUsed:
        "search_hospitals",
    };
  }

  const visibleProviders =
    moreResults
      ? providers
      : result.data;

  const shownProviderIds =
    Array.from(
      new Set([
        ...previousIds,

        ...visibleProviders.map(
          (provider) =>
            provider.id,
        ),
      ]),
    );

  state.conversationState = {
    ...state.conversationState,

    phase:
      emergencyAvailable
        ? "urgent_care"
        : "provider_results",

    providerType:
      "hospital",

    specialty:
      null,

    city,

    awaiting:
      null,

    lastSearch: {
      providerType:
        "hospital",

      city,

      specialty:
        null,

      emergencyAvailable,

      shownProviderIds,
    },
  };

  state.toolResult =
    visibleProviders;

  syncCompatibilityFields(
    state,
  );

  return {
    response: {
      action:
        "provider_results",

      message:
        hospitalsFoundMessage(
          state.conversationState
            .responseLanguage,
          emergencyAvailable,
        ),

      providers:
        visibleProviders,
    },

    toolUsed:
      "search_hospitals",
  };
}

function aiUnavailableResult(
  state: AgentState,
): AgentRunResult {
  return {
    ok:
      false,

    code:
      "AI_UNAVAILABLE",

    message:
      state.conversationState
        .responseLanguage ===
      "ar"
        ? "المساعدة الذكية غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى بعد قليل."
        : "AI assistance is temporarily unavailable. Please try again shortly.",
  };
}

export async function runAgent(
  input: unknown,
): Promise<AgentRunResult> {
  const parsed =
    chatRequestSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      ok:
        false,

      code:
        "INVALID_REQUEST",

      message:
        "The request is invalid.",
    };
  }

  const {
    message,
    conversation,
    conversationState:
      suppliedState,
  } = parsed.data;

  const initialLanguage =
    determineLocale(
      message,
    );

  const conversationState =
    suppliedState ??
    createInitialConversationState(
      initialLanguage,
    );

  const safetyResult =
    screenForUrgency(
      message,
    );

  const state: AgentState = {
    locale:
      conversationState
        .responseLanguage,

    userMessage:
      message,

    conversation,

    safetyStatus:
      safetyResult.status,

    conversationState,

    urgentContextActive:
      isUrgentState(
        conversationState,
      ),

    previousCareRecommendation:
      conversationState
        .careRecommendation,

    missingFields:
      [],
  };

  /*
   * CURRENT-TURN DETERMINISTIC SAFETY
   */
  if (
    safetyResult.status ===
    "urgent"
  ) {
    state.locale =
      safetyResult.locale;

    state.conversationState = {
      ...state.conversationState,

      phase:
        "urgent_care",

      responseLanguage:
        safetyResult.locale,

      careRecommendation:
        "urgent_in_person",

      providerType:
        "hospital",

      specialty:
        null,

      city:
        null,

      awaiting:
        "city",

      lastSearch:
        null,

      lastRecommendationMessage:
        safetyResult.message,
    };

    syncCompatibilityFields(
      state,
    );

    return {
      ok:
        true,

      state,

      response: {
        action:
          "urgent",

        message:
          combineMessages(
            safetyResult.message,
            askCityMessage(
              safetyResult.locale,
              true,
            ),
          ),
      },

      meta: {
        aiUsed:
          false,
      },
    };
  }

  /*
   * ACTIVE CLINICAL INTAKE
   *
   * Skip semantic router.
   */
  if (
    state.conversationState
      .phase ===
    "clinical_intake"
  ) {
    try {
      const assessment =
        await assessClinicalContext(
          state,
          state.conversationState
            .responseLanguage,
        );

      const response =
        applyClinicalAssessment(
          state,
          assessment,
        );

      return {
        ok:
          true,

        state,

        response,

        meta: {
          aiUsed:
            true,
        },
      };
    } catch (error) {
      console.error(
        "[agent]",
        {
          category:
            "clinical_assessment_failed",

          error:
            error instanceof Error
              ? error.message
              : "unknown_error",
        },
      );

      return aiUnavailableResult(
        state,
      );
    }
  }

  try {
    const route =
      await routeConversation(
        state,
      );

    state.conversationState = {
      ...state.conversationState,

      responseLanguage:
        route.responseLanguage,

      preferredName:
        route.preferredName ??
        state.conversationState
          .preferredName,
    };

    state.locale =
      route.responseLanguage;

    /*
     * URGENT FLOW
     */
    if (
      isUrgentState(
        state.conversationState,
      )
    ) {
      /*
       * Country-level location is not
       * precise enough for our city-based
       * provider search.
       *
       * Also clear an old city such as Aden
       * so it cannot accidentally be reused.
       */
      if (
        route.action ===
          "update_location" &&
        route.locationScope ===
          "country" &&
        route.country
      ) {
        state.conversationState = {
          ...state.conversationState,

          phase:
            "urgent_care",

          city:
            null,

          providerType:
            "hospital",

          awaiting:
            "city",
        };

        syncCompatibilityFields(
          state,
        );

        return {
          ok:
            true,

          state,

          response: {
            action:
              "urgent",

            message:
              askCityWithinCountryMessage(
                route.responseLanguage,
                route.country,
                true,
              ),
          },

          meta: {
            aiUsed:
              true,
          },
        };
      }

      if (
        route.action ===
          "more_provider_results"
      ) {
        const city =
          state.conversationState
            .lastSearch
            ?.city ??
          state.conversationState
            .city;

        if (!city) {
          state.conversationState.awaiting =
            "city";

          return {
            ok:
              true,

            state,

            response: {
              action:
                "urgent",

              message:
                askCityMessage(
                  route.responseLanguage,
                  true,
                ),
            },

            meta: {
              aiUsed:
                true,
            },
          };
        }

        const searched =
          await searchHospitals(
            state,
            city,
            true,
            true,
          );

        return {
          ok:
            true,

          state,

          response:
            searched.response,

          meta: {
            aiUsed:
              true,

            toolUsed:
              searched.toolUsed,
          },
        };
      }

      if (
        route.action ===
          "update_location" ||
        route.action ===
          "find_provider"
      ) {
        /*
         * For update_location we must not
         * fall back to the previous city.
         *
         * The user is explicitly changing
         * their location.
         */
        const city =
          route.action ===
            "update_location"
            ? route.city
            : (
                route.city ??
                state
                  .conversationState
                  .city
              );

        if (!city) {
          state.conversationState = {
            ...state.conversationState,

            phase:
              "urgent_care",

            city:
              null,

            providerType:
              "hospital",

            awaiting:
              "city",
          };

          syncCompatibilityFields(
            state,
          );

          return {
            ok:
              true,

            state,

            response: {
              action:
                "urgent",

              message:
                route.locationScope ===
                  "country" &&
                route.country
                  ? askCityWithinCountryMessage(
                      route.responseLanguage,
                      route.country,
                      true,
                    )
                  : askCityMessage(
                      route.responseLanguage,
                      true,
                    ),
            },

            meta: {
              aiUsed:
                true,
            },
          };
        }

        state.conversationState.city =
          city;

        const searched =
          await searchHospitals(
            state,
            city,
            true,
          );

        return {
          ok:
            true,

          state,

          response:
            searched.response,

          meta: {
            aiUsed:
              true,

            toolUsed:
              searched.toolUsed,
          },
        };
      }

      if (
        !state.conversationState
          .city
      ) {
        state.conversationState.awaiting =
          "city";

        return {
          ok:
            true,

          state,

          response: {
            action:
              "urgent",

            message:
              combineMessages(
                route.replyMessage ??
                  state
                    .conversationState
                    .lastRecommendationMessage ??
                  urgentRecommendationMessage(
                    route.responseLanguage,
                  ),

                askCityMessage(
                  route.responseLanguage,
                  true,
                ),
              ),
          },

          meta: {
            aiUsed:
              true,
          },
        };
      }

      return {
        ok:
          true,

        state,

        response: {
          action:
            "urgent",

          message:
            route.replyMessage ??
            state.conversationState
              .lastRecommendationMessage ??
            urgentRecommendationMessage(
              route.responseLanguage,
            ),
        },

        meta: {
          aiUsed:
            true,
        },
      };
    }

    /*
     * NEW CLINICAL CONCERN
     */
    if (
      route.action ===
      "clinical_assessment"
    ) {
      const assessment =
        await assessClinicalContext(
          state,
          route.responseLanguage,
        );

      const response =
        applyClinicalAssessment(
          state,
          assessment,
        );

      return {
        ok:
          true,

        state,

        response,

        meta: {
          aiUsed:
            true,
        },
      };
    }

    /*
     * USER ASKS ABOUT RECOMMENDATION
     */
    if (
      route.action ===
      "ask_about_recommendation"
    ) {
      if (
        state.conversationState
          .phase ===
        "awaiting_city"
      ) {
        return {
          ok:
            true,

          state,

          response: {
            action:
              "clarify",

            message:
              combineMessages(
                route.replyMessage ??
                  recommendationFallback(
                    state
                      .conversationState,
                  ),

                askCityMessage(
                  route.responseLanguage,
                  false,
                  state
                    .conversationState
                    .specialty,
                ),
              ),
          },

          meta: {
            aiUsed:
              true,
          },
        };
      }

      return {
        ok:
          true,

        state,

        response: {
          action:
            "guidance",

          message:
            route.replyMessage ??
            recommendationFallback(
              state.conversationState,
            ),
        },

        meta: {
          aiUsed:
            true,
        },
      };
    }

    if (
      route.action ===
      "more_provider_results"
    ) {
      const lastSearch =
        state.conversationState
          .lastSearch;

      if (!lastSearch) {
        if (
          state.conversationState
            .providerType ===
          "doctor"
        ) {
          return {
            ok:
              true,

            state,

            response: {
              action:
                "clarify",

              message:
                askCityMessage(
                  route.responseLanguage,
                  false,
                  state
                    .conversationState
                    .specialty,
                ),
            },

            meta: {
              aiUsed:
                true,
            },
          };
        }

        return {
          ok:
            true,

          state,

          response: {
            action:
              "clarify",

          message:
            route.responseLanguage ===
            "ar"
              ? "أخبرني بالمدينة حتى أتمكن من البحث عن خيارات مناسبة."
              : "Tell me the city so I can search for appropriate options.",
          },

          meta: {
            aiUsed:
              true,
          },
        };
      }

      if (
        lastSearch.providerType ===
        "doctor"
      ) {
        if (!lastSearch.specialty) {
          return {
            ok:
              true,

            state,

            response: {
              action:
                "clarify",

              message:
                askSpecialtyMessage(
                  route.responseLanguage,
                ),
            },

            meta: {
              aiUsed:
                true,
            },
          };
        }

        const searched =
          await searchDoctors(
            state,
            lastSearch.city,
            lastSearch.specialty,
            true,
          );

        return {
          ok:
            true,

          state,

          response:
            searched.response,

          meta: {
            aiUsed:
              true,

            toolUsed:
              searched.toolUsed,
          },
        };
      }

      const searched =
        await searchHospitals(
          state,
          lastSearch.city,
          lastSearch
            .emergencyAvailable ===
            true,
          true,
        );

      return {
        ok:
          true,

        state,

        response:
          searched.response,

        meta: {
          aiUsed:
            true,

          toolUsed:
            searched.toolUsed,
        },
      };
    }

    /*
     * USER SUPPLIED OR CHANGED LOCATION
     */
    if (
      route.action ===
      "update_location"
    ) {
      /*
       * A country is not precise enough
       * for our DB because provider tools
       * currently search by city.
       */
      if (
        route.locationScope ===
          "country" &&
        route.country
      ) {
        state.conversationState = {
          ...state.conversationState,

          phase:
            "awaiting_city",

          city:
            null,

          awaiting:
            "city",
        };

        syncCompatibilityFields(
          state,
        );

        return {
          ok:
            true,

          state,

          response: {
            action:
              "clarify",

            message:
              askCityWithinCountryMessage(
                route.responseLanguage,
                route.country,
                false,
              ),
          },

          meta: {
            aiUsed:
              true,
          },
        };
      }

      if (
        route.locationScope !==
          "city" ||
        !route.city
      ) {
        state.conversationState.city =
          null;

        state.conversationState.awaiting =
          "city";

        syncCompatibilityFields(
          state,
        );

        return {
          ok:
            true,

          state,

          response: {
            action:
              "clarify",

            message:
              askCityMessage(
                route.responseLanguage,
                false,
                state
                  .conversationState
                  .specialty,
              ),
          },

          meta: {
            aiUsed:
              true,
          },
        };
      }

      state.conversationState.city =
        route.city;

      if (
        state.conversationState
          .phase ===
          "awaiting_city" &&
        state.conversationState
          .providerType ===
          "doctor"
      ) {
        const specialty =
          state.conversationState
            .specialty ??
          "General Medicine";

        const searched =
          await searchDoctors(
            state,
            route.city,
            specialty,
          );

        return {
          ok:
            true,

          state,

          response:
            searched.response,

          meta: {
            aiUsed:
              true,

            toolUsed:
              searched.toolUsed,
          },
        };
      }

      if (
        state.conversationState
          .phase ===
          "awaiting_city" &&
        state.conversationState
          .providerType ===
          "hospital"
      ) {
        const searched =
          await searchHospitals(
            state,
            route.city,
            false,
          );

        return {
          ok:
            true,

          state,

          response:
            searched.response,

          meta: {
            aiUsed:
              true,

            toolUsed:
              searched.toolUsed,
          },
        };
      }

      if (
        state.conversationState
          .lastSearch
      ) {
        const lastSearch =
          state.conversationState
            .lastSearch;

        if (
          lastSearch.providerType ===
          "doctor"
        ) {
          const specialty =
            lastSearch.specialty ??
            "General Medicine";

          const searched =
            await searchDoctors(
              state,
              route.city,
              specialty,
            );

          return {
            ok:
              true,

            state,

            response:
              searched.response,

            meta: {
              aiUsed:
                true,

              toolUsed:
                searched.toolUsed,
            },
          };
        }

        const searched =
          await searchHospitals(
            state,
            route.city,
            lastSearch
              .emergencyAvailable ===
              true,
        );

        return {
          ok:
            true,

          state,

          response:
            searched.response,

          meta: {
            aiUsed:
              true,

            toolUsed:
              searched.toolUsed,
          },
        };
      }

      syncCompatibilityFields(
        state,
      );

      return {
        ok:
          true,

        state,

        response: {
          action:
            "guidance",

          message:
            route.responseLanguage ===
            "ar"
              ? `سأستخدم ${route.city} كموقع البحث الحالي.`
              : `I'll use ${route.city} as the current search location.`,
        },

        meta: {
          aiUsed:
            true,
        },
      };
    }

    /*
     * PROVIDER REQUEST
     */
    if (
      route.action ===
      "find_provider"
    ) {
      const providerType =
        route.providerType ??
        state.conversationState
          .providerType ??
        "doctor";

      /*
       * Country-level information is not
       * sufficient for a provider search.
       */
      if (
        route.locationScope ===
          "country" &&
        route.country
      ) {
        state.conversationState = {
          ...state.conversationState,

          phase:
            "awaiting_city",

          city:
            null,

          providerType,

          awaiting:
            "city",
        };

        syncCompatibilityFields(
          state,
        );

        return {
          ok:
            true,

          state,

          response: {
            action:
              "clarify",

            message:
              askCityWithinCountryMessage(
                route.responseLanguage,
                route.country,
                false,
              ),
          },

          meta: {
            aiUsed:
              true,
          },
        };
      }

      const city =
        route.locationScope ===
          "city"
          ? route.city
          : state.conversationState
              .city;

      let specialty =
        route.specialty ??
        state.conversationState
          .specialty;

      if (
        providerType ===
          "doctor" &&
        !specialty
      ) {
        specialty =
          "General Medicine";
      }

      if (!city) {
        state.conversationState = {
          ...state.conversationState,

          phase:
            "awaiting_city",

          city:
            null,

          providerType,

          specialty:
            providerType ===
            "doctor"
              ? specialty
              : null,

          awaiting:
            "city",
        };

        syncCompatibilityFields(
          state,
        );

        return {
          ok:
            true,

          state,

          response: {
            action:
              "clarify",

            message:
              askCityMessage(
                route.responseLanguage,
                false,
                specialty,
              ),
          },

          meta: {
            aiUsed:
              true,
          },
        };
      }

      if (
        providerType ===
        "hospital"
      ) {
        const searched =
          await searchHospitals(
            state,
            city,
            false,
          );

        return {
          ok:
            true,

          state,

          response:
            searched.response,

          meta: {
            aiUsed:
              true,

            toolUsed:
              searched.toolUsed,
          },
        };
      }

      const searched =
        await searchDoctors(
          state,
          city,
          specialty ??
            "General Medicine",
        );

      return {
        ok:
          true,

        state,

        response:
          searched.response,

        meta: {
          aiUsed:
            true,

          toolUsed:
            searched.toolUsed,
        },
      };
    }

    /*
     * SAFETY NET:
     *
     * If we're waiting for a city,
     * generic conversation cannot reset
     * provider navigation.
     */
    if (
      state.conversationState
        .phase ===
      "awaiting_city"
    ) {
      return {
        ok:
          true,

        state,

        response: {
          action:
            "clarify",

          message:
            askCityMessage(
              route.responseLanguage,
              false,
              state
                .conversationState
                .specialty,
            ),
        },

        meta: {
          aiUsed:
            true,
        },
      };
    }

    if (
      state.conversationState
        .phase ===
      "provider_results"
    ) {
      return {
        ok:
          true,

        state,

        response: {
          action:
            "guidance",

          message:
            route.replyMessage ??
            (
              route.responseLanguage ===
              "ar"
                ? "يمكنني مساعدتك في عرض خيار آخر، تغيير المدينة، أو متابعة معلومات مقدمي الخدمة الموجودين في قاعدة البيانات."
                : "I can show another option, change the city, or continue helping with the providers returned from the database."
            ),
        },

        meta: {
          aiUsed:
            true,
        },
      };
    }

    return {
      ok:
        true,

      state,

      response: {
        action:
          "guidance",

        message:
          route.replyMessage ??
          (
            route.responseLanguage ===
            "ar"
              ? "صف لي ما تشعر به، وسأساعدك في تحديد الخطوة المناسبة ثم البحث عن طبيب أو مستشفى من قاعدة بيانات HealTrip."
              : "Tell me what you're experiencing, and I'll help determine the appropriate next step and then search the HealTrip database for a doctor or hospital."
          ),
      },

      meta: {
        aiUsed:
          true,
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

    return aiUnavailableResult(
      state,
    );
  }
}