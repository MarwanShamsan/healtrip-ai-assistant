import {
  NextResponse,
} from "next/server";

import {
  runAgent,
} from "../../../lib/ai/agent";

export const runtime =
  "nodejs";

const JSON_HEADERS = {
  "Content-Type":
    "application/json; charset=utf-8",
};

function doctorSharePrompt(
  language: "en" | "ar",
): string {
  if (language === "ar") {
    return "إذا كان لديك حجز مع أحد هؤلاء الأطباء، اختر الطبيب وأدخل مرجع الحجز. يمكنني إعداد ملخص مختصر للأعراض والتوصية لمراجعته قبل مشاركته مع الطبيب.";
  }

  return "If you already have a reservation with one of these doctors, select the doctor and enter your reservation reference. I can prepare a concise summary of your reported symptoms and care recommendation for you to review before sharing.";
}

export async function POST(
  request: Request,
) {
  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        ok:
          false,

        error: {
          code:
            "INVALID_JSON",

          message:
            "The request body must contain valid JSON.",
        },
      },

      {
        status:
          400,

        headers:
          JSON_HEADERS,
      },
    );
  }

  try {
    const result =
      await runAgent(
        body,
      );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok:
            false,

          error: {
            code:
              result.code,

            message:
              result.message,
          },
        },

        {
          status:
            result.code ===
            "INVALID_REQUEST"
              ? 400
              : 503,

          headers:
            JSON_HEADERS,
        },
      );
    }

    /*
     * Doctor provider results get an explicit
     * reservation-summary invitation.
     *
     * This does NOT create provider data.
     * The provider list is still exactly what
     * came from the trusted database tool.
     */
    let response =
      result.response;

    if (
      response.action ===
      "provider_results"
    ) {
      const containsDoctor =
        response.providers.some(
          (provider) =>
            provider.providerType ===
            "doctor",
        );

      if (containsDoctor) {
        const language =
          result.state
            .conversationState
            .responseLanguage;

        response = {
          ...response,

          message: `${response.message}\n\n${doctorSharePrompt(
            language,
          )}`,
        };
      }
    }

    return NextResponse.json(
      {
        ok:
          true,

        response,

        conversationState:
          result.state
            .conversationState,

        meta: {
          aiUsed:
            result.meta
              .aiUsed,

          ...(result.meta
            .toolUsed
            ? {
                toolUsed:
                  result.meta
                    .toolUsed,
              }
            : {}),
        },
      },

      {
        status:
          200,

        headers:
          JSON_HEADERS,
      },
    );
  } catch (error) {
    console.error(
      "[api/chat]",
      {
        category:
          "unexpected_chat_error",

        error:
          error instanceof Error
            ? error.message
            : "unknown_error",
      },
    );

    return NextResponse.json(
      {
        ok:
          false,

        error: {
          code:
            "INTERNAL_ERROR",

          message:
            "An unexpected error occurred.",
        },
      },

      {
        status:
          500,

        headers:
          JSON_HEADERS,
      },
    );
  }
}