"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Locale =
  | "en"
  | "ar";

type CareRecommendation =
  | "monitor_and_self_care"
  | "see_doctor_routine"
  | "see_doctor_soon"
  | "urgent_in_person";

type ConversationPhase =
  | "idle"
  | "clinical_intake"
  | "care_recommended"
  | "awaiting_city"
  | "provider_results"
  | "urgent_care";

type Specialty =
  | "Cardiology"
  | "General Medicine"
  | "Neurology"
  | "Orthopedics"
  | "Dermatology"
  | "ENT";

type ConversationState = {
  phase:
    ConversationPhase;

  responseLanguage:
    Locale;

  preferredName:
    string | null;

  careRecommendation:
    CareRecommendation | null;

  providerType:
    "doctor" | "hospital" | null;

  specialty:
    Specialty | null;

  city:
    string | null;

  awaiting:
    "city" | "specialty" | null;

  lastSearch: {
    providerType:
      "doctor" | "hospital";

    city:
      string;

    specialty:
      Specialty | null;

    emergencyAvailable:
      boolean | null;

    shownProviderIds:
      string[];
  } | null;

  lastClinicalSummary:
    string | null;

  lastRecommendationRationale:
    string | null;

  lastRecommendationMessage:
    string | null;
};

type HospitalProvider = {
  providerType:
    "hospital";

  id:
    string;

  name:
    string;

  city:
    string;

  country:
    string;

  address:
    string | null;

  emergencyAvailable:
    boolean;

  languages:
    string[];
};

type DoctorProvider = {
  providerType:
    "doctor";

  id:
    string;

  name:
    string;

  specialty:
    string;

  city:
    string;

  languages:
    string[];

  bio:
    string | null;

  hospital: {
    id:
      string;

    name:
      string;

    city:
      string;

    country:
      string;

    address:
      string | null;

    emergencyAvailable:
      boolean;

    languages:
      string[];
  };
};

type Provider =
  | DoctorProvider
  | HospitalProvider;

type AssistantAction =
  | "urgent"
  | "clarify"
  | "provider_results"
  | "guidance";

type ChatMessage = {
  id:
    string;

  role:
    "user" | "assistant";

  content:
    string;

  responseLanguage?:
    Locale;

  action?:
    AssistantAction;

  providers?:
    Provider[];
};

type ChatApiSuccess = {
  ok:
    true;

  response:
    | {
        action:
          "urgent";

        message:
          string;
      }
    | {
        action:
          "clarify";

        message:
          string;
      }
    | {
        action:
          "guidance";

        message:
          string;
      }
    | {
        action:
          "provider_results";

        message:
          string;

        providers:
          Provider[];
      };

  conversationState:
    ConversationState;

  meta: {
    aiUsed:
      boolean;

    toolUsed?:
      | "search_doctors"
      | "search_hospitals";
  };
};

type ChatApiError = {
  ok:
    false;

  error: {
    code:
      string;

    message:
      string;
  };
};

type ChatApiResponse =
  | ChatApiSuccess
  | ChatApiError;

type PreparedShare = {
  status:
    | "preview"
    | "ready_to_share";

  providerType:
    "doctor" | "hospital";

  providerId:
    string;

  reservationReference:
    string;

  reportedConcern:
    string;

  careRecommendation:
    CareRecommendation | null;

  recommendation:
    string | null;

  consentGiven:
    boolean;
};

type ShareApiSuccess = {
  ok:
    true;

  share:
    PreparedShare;

  transmitted:
    false;
};

type ShareApiError = {
  ok:
    false;

  error: {
    code:
      string;

    message:
      string;
  };
};

type ShareApiResponse =
  | ShareApiSuccess
  | ShareApiError;

const copy = {
  en: {
    title:
      "HealTrip AI",
    subtitle:
      "Smart health navigation assistant",
    disclaimer:
      "This prototype provides navigation and general information only. It does not provide a medical diagnosis.",
    placeholder:
      "Describe your symptoms or what kind of provider you need...",
    send:
      "Send",
    sending:
      "Thinking...",
    newChat:
      "New chat",
    welcomeTitle:
      "Welcome to HealTrip",
    welcomeText:
      "Describe your health concern in English or Arabic. HealTrip can guide the conversation, recommend an appropriate next step, and help you find doctors or hospitals from the trusted demo database.",
    assistantLabel:
      "HealTrip",
    userLabel:
      "You",
    error:
      "Something went wrong. Please try again.",
    demoProvider:
      "Demo provider",
    specialty:
      "Specialty",
    city:
      "City",
    hospital:
      "Hospital",
    languages:
      "Languages",
    address:
      "Address",
    emergency:
      "Emergency services",
    available:
      "Available",
    unavailable:
      "Not available",
    prepareSummary:
      "Prepare summary",
    sharePrompt:
      "Select a doctor or hospital to prepare a concise summary of the important symptoms reported in this conversation. Review and edit it before sharing.",
    reportedInformation:
      "Relevant symptoms to share",
    reportedInformationHint:
      "Only clinically relevant information already reported in this conversation is prefilled. Review, add, or edit it before creating the summary.",
    reportedInformationPlaceholder:
      "No relevant symptoms were captured yet. Add them here if needed.",
    selectedProvider:
      "Selected provider",
    reservationReference:
      "Reservation reference",
    reservationPlaceholder:
      "Enter your reservation reference",
    hospitalReference:
      "Visit / reference number (optional)",
    hospitalReferencePlaceholder:
      "Enter a visit or reference number if available",
    previewSummary:
      "Preview summary",
    preparing:
      "Preparing...",
    sharePreview:
      "Summary preview",
    reportedConcern:
      "Reported concern",
    careRecommendation:
      "Care recommendation",
    recommendation:
      "Recommendation",
    consentText:
      "I consent to preparing this summary for sharing with the selected provider.",
    consentButton:
      "Confirm and prepare for sharing",
    confirming:
      "Confirming...",
    ready:
      "Ready to share",
    readyMessage:
      "The summary is ready for the provider-sharing step.",
    prototypeNotice:
      "Prototype only: no health information has been transmitted to the doctor or hospital.",
    cancel:
      "Cancel",
    phase:
      "Current stage",
    recommendationBadge:
      "Recommended care",
    inputHint:
      "Press Enter to send · Shift + Enter for a new line",
    emptyProviders:
      "No matching providers were found in the demo database.",
  },

  ar: {
    title:
      "HealTrip AI",
    subtitle:
      "مساعد ذكي للتوجيه الصحي",
    disclaimer:
      "هذا النموذج التجريبي يقدم التوجيه والمعلومات العامة فقط ولا يقدم تشخيصًا طبيًا.",
    placeholder:
      "اكتب الأعراض أو نوع مقدم الخدمة الذي تحتاجه...",
    send:
      "إرسال",
    sending:
      "جاري التفكير...",
    newChat:
      "محادثة جديدة",
    welcomeTitle:
      "مرحبًا بك في HealTrip",
    welcomeText:
      "اشرح مشكلتك الصحية بالعربية أو الإنجليزية. يمكن لـ HealTrip إدارة الحوار، واقتراح الخطوة المناسبة، ومساعدتك في العثور على أطباء أو مستشفيات من قاعدة البيانات التجريبية الموثوقة.",
    assistantLabel:
      "HealTrip",
    userLabel:
      "أنت",
    error:
      "حدث خطأ. يرجى المحاولة مرة أخرى.",
    demoProvider:
      "مقدم خدمة تجريبي",
    specialty:
      "التخصص",
    city:
      "المدينة",
    hospital:
      "المستشفى",
    languages:
      "اللغات",
    address:
      "العنوان",
    emergency:
      "خدمات الطوارئ",
    available:
      "متاحة",
    unavailable:
      "غير متاحة",
    prepareSummary:
      "إعداد الملخص",
    sharePrompt:
      "اختر طبيبًا أو مستشفى لإعداد ملخص مختصر للأعراض المهمة التي ذكرتها في هذه المحادثة. راجعه وعدّله قبل المشاركة.",
    reportedInformation:
      "الأعراض المهمة للمشاركة",
    reportedInformationHint:
      "يتم تعبئة المعلومات الصحية المهمة التي ذكرتها في المحادثة فقط. راجعها أو أضف إليها أو عدّلها قبل إعداد الملخص.",
    reportedInformationPlaceholder:
      "لم يتم التقاط أعراض مهمة بعد. أضفها هنا إذا لزم الأمر.",
    selectedProvider:
      "مقدم الخدمة المختار",
    reservationReference:
      "مرجع الحجز",
    reservationPlaceholder:
      "أدخل مرجع الحجز",
    hospitalReference:
      "رقم الزيارة / المرجع (اختياري)",
    hospitalReferencePlaceholder:
      "أدخل رقم الزيارة أو المرجع إن وجد",
    previewSummary:
      "معاينة الملخص",
    preparing:
      "جاري الإعداد...",
    sharePreview:
      "معاينة الملخص",
    reportedConcern:
      "المشكلة المبلغ عنها",
    careRecommendation:
      "توصية الرعاية",
    recommendation:
      "التوصية",
    consentText:
      "أوافق على إعداد هذا الملخص للمشاركة مع مقدم الخدمة المختار.",
    consentButton:
      "تأكيد وإعداد الملخص للمشاركة",
    confirming:
      "جاري التأكيد...",
    ready:
      "جاهز للمشاركة",
    readyMessage:
      "الملخص جاهز لخطوة المشاركة مع مقدم الخدمة.",
    prototypeNotice:
      "نموذج تجريبي فقط: لم يتم إرسال أي معلومات صحية إلى الطبيب أو المستشفى.",
    cancel:
      "إلغاء",
    phase:
      "المرحلة الحالية",
    recommendationBadge:
      "توصية الرعاية",
    inputHint:
      "اضغط Enter للإرسال · Shift + Enter لسطر جديد",
    emptyProviders:
      "لم يتم العثور على مقدمي خدمة مطابقين في قاعدة البيانات التجريبية.",
  },
} as const;

function createId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getPhaseLabel(
  phase:
    ConversationPhase | undefined,
  locale:
    Locale,
): string {
  const labels = {
    en: {
      idle:
        "Idle",
      clinical_intake:
        "Clinical intake",
      care_recommended:
        "Care recommended",
      awaiting_city:
        "Awaiting city",
      provider_results:
        "Provider results",
      urgent_care:
        "Urgent care",
    },
    ar: {
      idle:
        "في وضع الانتظار",
      clinical_intake:
        "جمع المعلومات",
      care_recommended:
        "تمت التوصية بالرعاية",
      awaiting_city:
        "بانتظار المدينة",
      provider_results:
        "نتائج مقدمي الخدمة",
      urgent_care:
        "رعاية عاجلة",
    },
  } as const;

  if (!phase) {
    return locale ===
      "ar"
      ? "غير متاح"
      : "N/A";
  }

  return labels[locale][phase];
}

function getRecommendationLabel(
  value:
    CareRecommendation | null | undefined,
  locale:
    Locale,
): string | null {
  if (!value) {
    return null;
  }

  const labels = {
    en: {
      monitor_and_self_care:
        "Monitor and self-care",
      see_doctor_routine:
        "Routine doctor visit",
      see_doctor_soon:
        "See a doctor soon",
      urgent_in_person:
        "Urgent in-person care",
    },
    ar: {
      monitor_and_self_care:
        "مراقبة ورعاية ذاتية",
      see_doctor_routine:
        "زيارة روتينية لطبيب",
      see_doctor_soon:
        "مراجعة طبيب قريبًا",
      urgent_in_person:
        "رعاية عاجلة حضوريًا",
    },
  } as const;

  return labels[locale][value];
}

function getMessageBubbleClasses(
  role:
    "user" | "assistant",
  action?:
    AssistantAction,
): string {
  if (role === "user") {
    return "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/20";
  }

  if (action === "urgent") {
    return "border border-red-200 bg-red-50 text-red-900";
  }

  return "border border-slate-200 bg-white text-slate-800 shadow-sm";
}

function buildReportedInformation(
  messages: ChatMessage[],
  fallbackSummary: string | null | undefined,
): string {
  /*
   * Prefer user messages that were immediately
   * followed by deterministic urgent routing.
   * This captures reported urgent symptoms while
   * excluding greetings, city names, and unrelated
   * follow-up questions.
   */
  const urgentReportedMessages =
    messages
      .map(
        (message, index) => {
          if (
            message.role !==
            "user"
          ) {
            return null;
          }

          const nextMessage =
            messages[
              index + 1
            ];

          if (
            nextMessage?.role ===
              "assistant" &&
            nextMessage.action ===
              "urgent"
          ) {
            return message.content.trim();
          }

          return null;
        },
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      );

  const uniqueUrgentMessages =
    Array.from(
      new Set(
        urgentReportedMessages,
      ),
    );

  const value =
    uniqueUrgentMessages.length >
    0
      ? uniqueUrgentMessages.join(
          "\n",
        )
      : fallbackSummary?.trim() ??
        "";

  return value.slice(
    0,
    8000,
  );
}

function ProviderCard({
  provider,
  locale,
  selected,
  onSelectProvider,
}: {
  provider:
    Provider;
  locale:
    Locale;
  selected:
    boolean;
  onSelectProvider:
    (
      provider: Provider,
    ) => void;
}) {
  const t =
    copy[locale];

  if (
    provider.providerType ===
    "doctor"
  ) {
    return (
      <div
        className={`group min-w-0 rounded-3xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
          selected
            ? "border-cyan-500 ring-2 ring-cyan-100"
            : "border-slate-200"
        }`}
      >
        <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row">
          <div>
            <p className="break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
              {provider.name}
            </p>

            <p className="mt-1 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
              {t.demoProvider}
            </p>
          </div>

          <span className="max-w-full self-start break-words rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 [overflow-wrap:anywhere]">
            {provider.specialty}
          </span>
        </div>

        <div className="mt-5 grid gap-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">
              {t.specialty}:
            </span>{" "}
            {provider.specialty}
          </p>

          <p>
            <span className="font-semibold text-slate-900">
              {t.city}:
            </span>{" "}
            {provider.city}
          </p>

          <p>
            <span className="font-semibold text-slate-900">
              {t.languages}:
            </span>{" "}
            {provider.languages.join(
              ", ",
            )}
          </p>

          <p>
            <span className="font-semibold text-slate-900">
              {t.hospital}:
            </span>{" "}
            {provider.hospital.name}
          </p>

          {provider.hospital.address && (
            <p>
              <span className="font-semibold text-slate-900">
                {t.address}:
              </span>{" "}
              {provider.hospital.address}
            </p>
          )}

          {provider.bio && (
            <p className="pt-2 text-slate-600">
              {provider.bio}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            onSelectProvider(
              provider,
            )
          }
          className="mt-5 inline-flex w-full touch-manipulation items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:opacity-95 hover:shadow-lg"
        >
          {t.prepareSummary}
        </button>

      </div>
    );
  }

  return (
    <div
      className={`min-w-0 rounded-3xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
        selected
          ? "border-cyan-500 ring-2 ring-cyan-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {provider.name}
          </p>

          <p className="mt-1 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
            {t.demoProvider}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            provider.emergencyAvailable
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {t.emergency}:{" "}
          {provider.emergencyAvailable
            ? t.available
            : t.unavailable}
        </span>
      </div>

      <div className="mt-5 grid gap-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-slate-900">
            {t.city}:
          </span>{" "}
          {provider.city},{" "}
          {provider.country}
        </p>

        <p>
          <span className="font-semibold text-slate-900">
            {t.languages}:
          </span>{" "}
          {provider.languages.join(
            ", ",
          )}
        </p>

        {provider.address && (
          <p>
            <span className="font-semibold text-slate-900">
              {t.address}:
            </span>{" "}
            {provider.address}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          onSelectProvider(
            provider,
          )
        }
        className="mt-5 inline-flex w-full touch-manipulation items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:opacity-95 hover:shadow-lg"
      >
        {t.prepareSummary}
      </button>
    </div>
  );
}

export default function Home() {
  const [
    uiLocale,
    setUiLocale,
  ] =
    useState<Locale>(
      "en",
    );

  const [
    messages,
    setMessages,
  ] =
    useState<
      ChatMessage[]
    >([]);

  const [
    conversationState,
    setConversationState,
  ] =
    useState<
      ConversationState | null
    >(null);

  const [
    input,
    setInput,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    selectedProvider,
    setSelectedProvider,
  ] =
    useState<
      Provider | null
    >(null);

  const [
    reservationReference,
    setReservationReference,
  ] =
    useState("");

  const [
    reportedConcernDraft,
    setReportedConcernDraft,
  ] =
    useState("");

  const [
    preparedShare,
    setPreparedShare,
  ] =
    useState<
      PreparedShare | null
    >(null);

  const [
    shareLoading,
    setShareLoading,
  ] =
    useState(false);

  const [
    shareError,
    setShareError,
  ] =
    useState<
      string | null
    >(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  const t =
    copy[uiLocale];

  const direction =
    uiLocale ===
    "ar"
      ? "rtl"
      : "ltr";

  const conversation =
    useMemo(
      () =>
        messages
          .slice(-20)
          .map(
            (message) => ({
              role:
                message.role,
              content:
                message.content,
            }),
          ),
      [messages],
    );

  const shareLocale =
    conversationState
      ?.responseLanguage ??
    uiLocale;

  const shareCopy =
    copy[shareLocale];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior:
          "smooth",
      },
    );
  }, [
    messages,
    isLoading,
    selectedProvider,
    preparedShare,
  ]);

  function selectProvider(
    provider: Provider,
  ) {
    setSelectedProvider(
      provider,
    );
    setReservationReference(
      "",
    );
    setReportedConcernDraft(
      buildReportedInformation(
        messages,
        conversationState
          ?.lastClinicalSummary,
      ),
    );
    setPreparedShare(
      null,
    );
    setShareError(
      null,
    );
  }

  function cancelShare() {
    setSelectedProvider(
      null,
    );
    setReservationReference(
      "",
    );
    setReportedConcernDraft(
      "",
    );
    setPreparedShare(
      null,
    );
    setShareError(
      null,
    );
  }

  async function callShareApi(
    mode:
      | "preview"
      | "confirm",
  ) {
    if (
      !selectedProvider ||
      !conversationState ||
      !reportedConcernDraft.trim() ||
      (
        selectedProvider.providerType ===
          "doctor" &&
        !reservationReference.trim()
      )
    ) {
      return;
    }

    setShareLoading(
      true,
    );
    setShareError(
      null,
    );

    try {
      const response =
        await fetch(
          "/api/share",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json; charset=utf-8",
            },
            body:
              JSON.stringify({
                mode,
                providerType:
                  selectedProvider.providerType,
                providerId:
                  selectedProvider.id,
                reservationReference:
                  reservationReference.trim(),
                reportedConcern:
                  reportedConcernDraft.trim(),
                conversationState,
                consent:
                  mode ===
                  "confirm",
              }),
          },
        );

      const data =
        (await response.json()) as
          ShareApiResponse;

      if ("error" in data) {
        setShareError(
          data.error.message,
        );
        return;
      }

      if (!response.ok) {
        setShareError(
          shareCopy.error,
        );
        return;
      }

      setPreparedShare(
        data.share,
      );
    } catch {
      setShareError(
        shareCopy.error,
      );
    } finally {
      setShareLoading(
        false,
      );
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmed =
      input.trim();

    if (
      !trimmed ||
      isLoading
    ) {
      return;
    }

    const previousConversation =
      conversation;

    const userMessage: ChatMessage =
      {
        id:
          createId(),
        role:
          "user",
        content:
          trimmed,
      };

    setMessages(
      (current) => [
        ...current,
        userMessage,
      ],
    );

    setInput("");
    setIsLoading(
      true,
    );

    try {
      const response =
        await fetch(
          "/api/chat",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json; charset=utf-8",
            },
            body:
              JSON.stringify({
                message:
                  trimmed,
                locale:
                  uiLocale,
                conversation:
                  previousConversation,
                ...(conversationState
                  ? {
                      conversationState,
                    }
                  : {}),
              }),
          },
        );

      const data =
        (await response.json()) as
          ChatApiResponse;

      if ("error" in data) {
        const errorMessage =
          data.error.message;

        setMessages(
          (current) => [
            ...current,
            {
              id:
                createId(),
              role:
                "assistant",
              content:
                errorMessage,
              responseLanguage:
                uiLocale,
            },
          ],
        );
        return;
      }

      if (!response.ok) {
        setMessages(
          (current) => [
            ...current,
            {
              id:
                createId(),
              role:
                "assistant",
              content:
                t.error,
              responseLanguage:
                uiLocale,
              action:
                "guidance",
            },
          ],
        );
        return;
      }

      setConversationState(
        data.conversationState,
      );

      if (
        data.response.action ===
        "provider_results"
      ) {
        setSelectedProvider(
          null,
        );
        setReservationReference(
          "",
        );
        setReportedConcernDraft(
          "",
        );
        setPreparedShare(
          null,
        );
        setShareError(
          null,
        );
      }

      const assistantMessage: ChatMessage =
        {
          id:
            createId(),
          role:
            "assistant",
          content:
            data.response
              .message,
          responseLanguage:
            data
              .conversationState
              .responseLanguage,
          action:
            data.response
              .action,
          providers:
            data.response
                .action ===
              "provider_results"
              ? data.response
                  .providers
              : undefined,
        };

      setMessages(
        (current) => [
          ...current,
          assistantMessage,
        ],
      );
    } catch {
      setMessages(
        (current) => [
          ...current,
          {
            id:
              createId(),
            role:
              "assistant",
            content:
              t.error,
            responseLanguage:
              uiLocale,
          },
        ],
      );
    } finally {
      setIsLoading(
        false,
      );

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }

  function handleTextareaKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      const fakeEvent = {
        preventDefault:
          () => undefined,
      } as FormEvent<HTMLFormElement>;

      void handleSubmit(
        fakeEvent,
      );
    }
  }

  function startNewChat() {
    if (
      isLoading ||
      shareLoading
    ) {
      return;
    }

    setMessages([]);
    setConversationState(
      null,
    );
    setInput("");
    cancelShare();

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }

  const currentPhase =
    conversationState?.phase;

  const currentRecommendation =
    getRecommendationLabel(
      conversationState?.careRecommendation,
      uiLocale,
    );

  return (
    <main
      dir={direction}
      className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef7fb_50%,_#f8fafc_100%)] text-slate-900"
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
        <header className="mb-3 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-sky-100/40 backdrop-blur sm:mb-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                {t.subtitle}
              </div>

              <h1 className="mt-4 bg-gradient-to-r from-[#062B73] via-[#0B66D6] to-[#16C7D8] bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                {t.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                {t.disclaimer}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <div className="grid w-full grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    setUiLocale(
                      "en",
                    )
                  }
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    uiLocale ===
                    "en"
                      ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md"
                      : "text-slate-700 hover:bg-white"
                  }`}
                >
                  English
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setUiLocale(
                      "ar",
                    )
                  }
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    uiLocale ===
                    "ar"
                      ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md"
                      : "text-slate-700 hover:bg-white"
                  }`}
                >
                  العربية
                </button>
              </div>

              <button
                type="button"
                onClick={
                  startNewChat
                }
                disabled={
                  isLoading ||
                  shareLoading
                }
                className="w-full touch-manipulation rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {t.newChat}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.phase}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {getPhaseLabel(
                  currentPhase,
                  uiLocale,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.recommendationBadge}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {currentRecommendation ??
                  (uiLocale ===
                  "ar"
                    ? "لا يوجد بعد"
                    : "Not available yet")}
              </p>
            </div>
          </div>
        </header>

        <section className="flex min-w-0 flex-1 overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-2xl shadow-sky-100/30 backdrop-blur">
          <div className="flex min-h-[68dvh] min-w-0 w-full flex-col sm:min-h-[72vh]">
            <div className="min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
              {messages.length ===
              0 ? (
                <div className="mx-auto max-w-2xl py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-r from-[#062B73] to-[#16C7D8] text-2xl font-bold text-white shadow-lg shadow-cyan-200">
                    H
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-slate-900">
                    {t.welcomeTitle}
                  </h2>

                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    {t.welcomeText}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map(
                    (message) => {
                      const isUser =
                        message.role ===
                        "user";

                      const messageLocale =
                        message.responseLanguage ??
                        uiLocale;

                      const messageCopy =
                        copy[
                          messageLocale
                        ];

                      const hasProviders =
                        Boolean(
                          message.providers &&
                            message.providers.length >
                              0,
                        );

                      return (
                        <div
                          key={
                            message.id
                          }
                          className={`flex min-w-0 gap-2 sm:gap-3 ${
                            isUser
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {!isUser && (
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#062B73] to-[#16C7D8] text-sm font-bold text-white shadow-md sm:flex">
                              H
                            </div>
                          )}

                          <div className="min-w-0 w-full max-w-3xl">
                            <div
                              className={`mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
                                isUser
                                  ? "justify-end text-slate-500"
                                  : "justify-start text-slate-500"
                              }`}
                            >
                              <span>
                                {isUser
                                  ? messageCopy.userLabel
                                  : messageCopy.assistantLabel}
                              </span>
                            </div>

                            <div
                              dir={
                                isUser
                                  ? "auto"
                                  : messageLocale ===
                                      "ar"
                                    ? "rtl"
                                    : "ltr"
                              }
                              className={`break-words rounded-[24px] px-4 py-4 text-sm leading-7 [overflow-wrap:anywhere] sm:px-5 sm:py-4 sm:text-[15px] ${getMessageBubbleClasses(
                                message.role,
                                message.action,
                              )}`}
                            >
                              <div className="whitespace-pre-wrap">
                                {
                                  message.content
                                }
                              </div>
                            </div>

                            {message.providers && (
                              <div
                                dir={
                                  messageLocale ===
                                  "ar"
                                    ? "rtl"
                                    : "ltr"
                                }
                                className="mt-4 grid gap-4"
                              >
                                {message
                                  .providers
                                  .length ===
                                0 ? (
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    {
                                      messageCopy.emptyProviders
                                    }
                                  </div>
                                ) : (
                                  message.providers.map(
                                    (
                                      provider,
                                    ) => (
                                      <ProviderCard
                                        key={
                                          provider.id
                                        }
                                        provider={
                                          provider
                                        }
                                        locale={
                                          messageLocale
                                        }
                                        selected={
                                          selectedProvider?.id ===
                                          provider.id
                                        }
                                        onSelectProvider={
                                          selectProvider
                                        }
                                      />
                                    ),
                                  )
                                )}

                                {hasProviders && (
                                  <div className="rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-sky-50 px-5 py-4 text-sm leading-6 text-slate-700 shadow-sm">
                                    {messageCopy.sharePrompt}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {isUser && (
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-md sm:flex">
                              U
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}

                  {selectedProvider && (
                    <div
                      dir={
                        shareLocale ===
                        "ar"
                          ? "rtl"
                          : "ltr"
                      }
                      className="min-w-0 rounded-[28px] border border-cyan-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {
                              shareCopy.selectedProvider
                            }
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {
                              selectedProvider.name
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {selectedProvider.providerType ===
                            "doctor"
                              ? `${selectedProvider.specialty} · ${selectedProvider.hospital.name}`
                              : `${selectedProvider.city}, ${selectedProvider.country}`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={
                            cancelShare
                          }
                          disabled={
                            shareLoading
                          }
                          className="w-full touch-manipulation rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                        >
                          {
                            shareCopy.cancel
                          }
                        </button>
                      </div>

                      <div className="mt-5">
                        <label className="text-sm font-semibold text-slate-800">
                          {
                            shareCopy.reportedInformation
                          }
                        </label>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {
                            shareCopy.reportedInformationHint
                          }
                        </p>

                        <textarea
                          value={
                            reportedConcernDraft
                          }
                          onChange={(
                            event,
                          ) => {
                            setReportedConcernDraft(
                              event
                                .target
                                .value,
                            );
                            setPreparedShare(
                              null,
                            );
                            setShareError(
                              null,
                            );
                          }}
                          maxLength={
                            8000
                          }
                          rows={6}
                          dir="auto"
                          placeholder={
                            shareCopy.reportedInformationPlaceholder
                          }
                          className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 sm:text-sm"
                        />
                      </div>

                      <div className="mt-5">
                        <label className="text-sm font-semibold text-slate-800">
                          {selectedProvider.providerType ===
                          "doctor"
                            ? shareCopy.reservationReference
                            : shareCopy.hospitalReference}
                        </label>

                        <input
                          value={
                            reservationReference
                          }
                          onChange={(
                            event,
                          ) => {
                            setReservationReference(
                              event
                                .target
                                .value,
                            );
                            setPreparedShare(
                              null,
                            );
                            setShareError(
                              null,
                            );
                          }}
                          placeholder={
                            selectedProvider.providerType ===
                            "doctor"
                              ? shareCopy.reservationPlaceholder
                              : shareCopy.hospitalReferencePlaceholder
                          }
                          maxLength={
                            100
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 sm:text-sm"
                        />
                      </div>

                      {!preparedShare && (
                        <button
                          type="button"
                          disabled={
                            shareLoading ||
                            !reportedConcernDraft.trim() ||
                            (
                              selectedProvider.providerType ===
                                "doctor" &&
                              !reservationReference.trim()
                            )
                          }
                          onClick={() =>
                            void callShareApi(
                              "preview",
                            )
                          }
                          className="mt-4 inline-flex w-full touch-manipulation items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:opacity-95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          {shareLoading
                            ? shareCopy.preparing
                            : shareCopy.previewSummary}
                        </button>
                      )}

                      {shareError && (
                        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                          {
                            shareError
                          }
                        </p>
                      )}

                      {preparedShare && (
                        <div className="mt-5 min-w-0 rounded-3xl border border-white/70 bg-white p-4 shadow-sm sm:p-5">
                          <h3 className="text-lg font-bold text-slate-900">
                            {preparedShare.status ===
                            "ready_to_share"
                              ? shareCopy.ready
                              : shareCopy.sharePreview}
                          </h3>

                          <div className="mt-5 grid gap-4 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {
                                  shareCopy.selectedProvider
                                }
                              </p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {
                                  selectedProvider.name
                                }
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {selectedProvider.providerType ===
                                "doctor"
                                  ? shareCopy.reservationReference
                                  : shareCopy.hospitalReference}
                              </p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {
                                  preparedShare.reservationReference ||
                                  (shareLocale ===
                                  "ar"
                                    ? "غير متوفر"
                                    : "Not provided")
                                }
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {
                                  shareCopy.reportedConcern
                                }
                              </p>
                              <p className="mt-1 text-slate-800">
                                {
                                  preparedShare.reportedConcern
                                }
                              </p>
                            </div>

                            {preparedShare.careRecommendation && (
                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  {
                                    shareCopy.careRecommendation
                                  }
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {getRecommendationLabel(
                                    preparedShare.careRecommendation,
                                    shareLocale,
                                  )}
                                </p>
                              </div>
                            )}

                            {preparedShare.recommendation && (
                              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  {
                                    shareCopy.recommendation
                                  }
                                </p>
                                <p className="mt-1 text-slate-800">
                                  {
                                    preparedShare.recommendation
                                  }
                                </p>
                              </div>
                            )}
                          </div>

                          {preparedShare.status ===
                          "preview" ? (
                            <div className="mt-5">
                              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                                {
                                  shareCopy.consentText
                                }
                              </p>

                              <button
                                type="button"
                                disabled={
                                  shareLoading
                                }
                                onClick={() =>
                                  void callShareApi(
                                    "confirm",
                                  )
                                }
                                className="mt-4 inline-flex w-full touch-manipulation items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:opacity-95 hover:shadow-lg disabled:opacity-50 sm:w-auto"
                              >
                                {shareLoading
                                  ? shareCopy.confirming
                                  : shareCopy.consentButton}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-5 space-y-3">
                              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                                {
                                  shareCopy.readyMessage
                                }
                              </p>

                              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                                {
                                  shareCopy.prototypeNotice
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex justify-start gap-3">
                      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#062B73] to-[#16C7D8] text-sm font-bold text-white shadow-md sm:flex">
                        H
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                        {t.sending}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="healtrip-composer border-t border-slate-200 bg-white/90 px-3 py-3 backdrop-blur sm:px-6 sm:py-4"
            >
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-2 shadow-inner sm:rounded-[28px] sm:p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                  <textarea
                    ref={
                      textareaRef
                    }
                    value={
                      input
                    }
                    onChange={(
                      event,
                    ) =>
                      setInput(
                        event.target
                          .value,
                      )
                    }
                    onKeyDown={
                      handleTextareaKeyDown
                    }
                    placeholder={
                      t.placeholder
                    }
                    maxLength={
                      2000
                    }
                    rows={2}
                    disabled={
                      isLoading
                    }
                    dir="auto"
                    className="min-h-[56px] w-full min-w-0 flex-1 resize-none rounded-2xl border border-transparent bg-white px-4 py-3 text-base leading-6 text-slate-900 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 sm:text-sm"
                  />

                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !input.trim()
                    }
                    className="inline-flex min-h-[52px] w-full touch-manipulation items-center justify-center rounded-2xl bg-gradient-to-r from-[#062B73] to-[#16C7D8] px-5 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition hover:opacity-95 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[56px] sm:w-auto"
                  >
                    {isLoading
                      ? t.sending
                      : t.send}
                  </button>
                </div>

                <p className="mt-2 hidden px-1 text-xs text-slate-500 sm:block">
                  {t.inputHint}
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}