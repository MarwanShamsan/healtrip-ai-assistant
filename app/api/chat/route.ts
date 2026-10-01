import { NextResponse } from "next/server";

import {
  runAgent,
} from "../../../lib/ai/agent";

export const runtime = "nodejs";

type ChatApiErrorResponse = {
  ok: false;
  error: {
    code:
      | "INVALID_REQUEST"
      | "INVALID_JSON"
      | "AI_UNAVAILABLE"
      | "INTERNAL_ERROR";
    message: string;
  };
};

const JSON_HEADERS = {
  "Content-Type":
    "application/json; charset=utf-8",
};

export async function POST(
  request: Request,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const response: ChatApiErrorResponse = {
      ok: false,
      error: {
        code: "INVALID_JSON",
        message:
          "The request body must contain valid JSON.",
      },
    };

    return NextResponse.json(
      response,
      {
        status: 400,
        headers: JSON_HEADERS,
      },
    );
  }

  try {
    const result =
      await runAgent(body);

    if (!result.ok) {
      const status =
        result.code ===
        "INVALID_REQUEST"
          ? 400
          : 503;

      const response: ChatApiErrorResponse = {
        ok: false,
        error: {
          code: result.code,
          message:
            result.message,
        },
      };

      return NextResponse.json(
        response,
        {
          status,
          headers: JSON_HEADERS,
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,

        response:
          result.response,

        meta: {
          aiUsed:
            result.meta.aiUsed,

          ...(result.meta.toolUsed
            ? {
                toolUsed:
                  result.meta.toolUsed,
              }
            : {}),
        },
      },
      {
        status: 200,
        headers: JSON_HEADERS,
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

    const response: ChatApiErrorResponse = {
      ok: false,

      error: {
        code: "INTERNAL_ERROR",
        message:
          "The request could not be completed.",
      },
    };

    return NextResponse.json(
      response,
      {
        status: 500,
        headers: JSON_HEADERS,
      },
    );
  }
}