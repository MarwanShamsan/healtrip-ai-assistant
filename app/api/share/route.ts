import {
  NextResponse,
} from "next/server";

import {
  shareRequestSchema,
} from "../../../lib/share/share-schema";

export const runtime =
  "nodejs";

const JSON_HEADERS = {
  "Content-Type":
    "application/json; charset=utf-8",
};

function errorResponse(
  status: number,
  code: string,
  message: string,
) {
  return NextResponse.json(
    {
      ok:
        false,

      error: {
        code,
        message,
      },
    },

    {
      status,

      headers:
        JSON_HEADERS,
    },
  );
}

export async function POST(
  request: Request,
) {
  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "The request body must contain valid JSON.",
    );
  }

  const parsed =
    shareRequestSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return errorResponse(
      400,
      "INVALID_SHARE_REQUEST",
      "The share request is invalid.",
    );
  }

  const {
    mode,
    doctorId,
    reservationReference,
    reportedConcern,
    conversationState,
    consent,
  } = parsed.data;

  /*
   * Provider grounding check.
   *
   * The doctor must have been present in the
   * doctor results shown during the current
   * provider-search workflow.
   *
   * For this prototype the structured state
   * is client-carried. In a production system
   * this state should be server-managed or
   * cryptographically protected.
   */
  const lastSearch =
    conversationState.lastSearch;

  if (
    !lastSearch ||
    lastSearch.providerType !==
      "doctor" ||
    !lastSearch.shownProviderIds.includes(
      doctorId,
    )
  ) {
    return errorResponse(
      409,
      "PROVIDER_NOT_IN_CURRENT_RESULTS",
      "The selected doctor is not part of the current trusted provider results.",
    );
  }

  /*
   * Consent is mandatory before the workflow
   * can move from preview -> ready_to_share.
   */
  if (
    mode === "confirm" &&
    !consent
  ) {
    return errorResponse(
      400,
      "CONSENT_REQUIRED",
      "Explicit consent is required before preparing the summary for sharing.",
    );
  }

  /*
   * Data minimization:
   *
   * We deliberately do NOT include:
   * - full conversation transcript
   * - unrelated chat
   * - inferred diagnosis
   * - provider data invented by AI
   *
   * Only the user-reviewed reported information
   * and the structured recommendation are included.
   */
  const preparedShare = {
    status:
      mode === "confirm"
        ? "ready_to_share"
        : "preview",

    doctorId,

    reservationReference,

    reportedConcern,

    careRecommendation:
      conversationState
        .careRecommendation,

    recommendation:
      conversationState
        .lastRecommendationMessage,

    consentGiven:
      mode === "confirm" &&
      consent,
  } as const;

  return NextResponse.json(
    {
      ok:
        true,

      share:
        preparedShare,

      /*
       * Important:
       *
       * This prototype does not actually
       * transmit health information.
       */
      transmitted:
        false,
    },

    {
      status:
        200,

      headers:
        JSON_HEADERS,
    },
  );
}