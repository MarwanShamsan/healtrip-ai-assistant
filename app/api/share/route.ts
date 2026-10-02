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
    providerType,
    providerId,
    reservationReference,
    reportedConcern,
    conversationState,
    consent,
  } = parsed.data;

  /*
   * Provider grounding check.
   *
   * The selected doctor or hospital must have
   * been returned in the current trusted search.
   *
   * For this prototype the structured state is
   * client-carried. A production system should
   * manage or cryptographically protect it.
   */
  const lastSearch =
    conversationState.lastSearch;

  if (
    !lastSearch ||
    lastSearch.providerType !==
      providerType ||
    !lastSearch.shownProviderIds.includes(
      providerId,
    )
  ) {
    return errorResponse(
      409,
      "PROVIDER_NOT_IN_CURRENT_RESULTS",
      "The selected provider is not part of the current trusted provider results.",
    );
  }

  /*
   * The original reservation-sharing flow requires
   * a booking reference for doctors. Hospital visit
   * summaries may be prepared without one.
   */
  if (
    providerType ===
      "doctor" &&
    !reservationReference
  ) {
    return errorResponse(
      400,
      "RESERVATION_REFERENCE_REQUIRED",
      "A reservation reference is required for a doctor summary.",
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
   * and structured recommendation are included.
   */
  const preparedShare = {
    status:
      mode === "confirm"
        ? "ready_to_share"
        : "preview",

    providerType,

    providerId,

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
