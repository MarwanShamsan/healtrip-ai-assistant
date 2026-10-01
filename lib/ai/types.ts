import type {
  ProviderRecord,
} from "../providers/types";

import type {
  ChatMessage,
  Locale,
} from "./schemas";

export type AgentNextStep =
  | "clarify"
  | "urgent"
  | "doctor_search"
  | "hospital_search"
  | "general_guidance";

export type AgentState = {
  locale: Locale;

  userMessage: string;

  conversation: ChatMessage[];

  safetyStatus:
    | "clear"
    | "urgent";

  intent?: string;

  specialty?: string;

  city?: string;

  providerType?:
    | "doctor"
    | "hospital";

  missingFields: string[];

  nextStep?: AgentNextStep;

  toolResult?: unknown;
};

export type AgentResponse =
  | {
      action: "urgent";
      message: string;
    }
  | {
      action: "clarify";
      message: string;
    }
  | {
      action: "provider_results";
      message: string;
      providers: ProviderRecord[];
    }
  | {
      action: "guidance";
      message: string;
    };

export type AgentPreflightResult =
  | {
      ok: false;
      code: "INVALID_REQUEST";
      message: string;
    }
  | {
      ok: true;
      stage: "complete";
      state: AgentState;
      response: AgentResponse;
    }
  | {
      ok: true;
      stage: "ready";
      state: AgentState;
    };

export type AgentRunResult =
  | {
      ok: false;
      code:
        | "INVALID_REQUEST"
        | "AI_UNAVAILABLE";
      message: string;
    }
  | {
      ok: true;
      state: AgentState;
      response: AgentResponse;
      meta: {
        aiUsed: boolean;

        toolUsed?:
          | "search_doctors"
          | "search_hospitals";
      };
    };