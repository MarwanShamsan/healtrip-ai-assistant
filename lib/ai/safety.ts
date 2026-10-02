import type {
  Locale,
} from "./schemas";

export type SafetyRuleId =
  | "chest_pain_with_breathing_difficulty"
  | "chest_pain"
  | "breathing_difficulty"
  | "possible_stroke_pattern"
  | "unresponsive"
  | "severe_bleeding";

export type SafetyResult =
  | {
      status: "clear";
      locale: Locale;
    }
  | {
      status: "urgent";
      locale: Locale;
      matchedRule: SafetyRuleId;
      message: string;
    };

const ARABIC_TEXT_PATTERN =
  /[\u0600-\u06FF]/u;

function normalizeText(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function determineLocale(
  message: string,
  requestedLocale?: Locale,
): Locale {
  if (requestedLocale) {
    return requestedLocale;
  }

  return ARABIC_TEXT_PATTERN.test(
    message,
  )
    ? "ar"
    : "en";
}

function urgentMessage(
  locale: Locale,
): string {
  if (locale === "ar") {
    return "الأعراض التي وصفتها تطابق قاعدة أمان عاجلة في هذا النموذج التجريبي. أوصي بطلب تقييم طبي عاجل شخصيًا الآن أو التواصل مع خدمات الطوارئ المحلية. هذا النظام لا يستطيع تحديد سبب الأعراض أو تقديم تشخيص طبي.";
  }

  return "The symptoms you described match an urgent safety rule in this prototype. I recommend seeking urgent in-person medical assessment now or contacting local emergency services. This system cannot determine the cause of your symptoms or provide a medical diagnosis.";
}

function clauseBefore(
  text: string,
  symptomIndex: number,
): string {
  const before =
    text.slice(
      0,
      symptomIndex,
    );

  const separators = [
    ".",
    "!",
    "?",
    ";",
    " but ",
    " however ",
    " yet ",
    "لكن",
    "ولكن",
  ];

  let startIndex = 0;

  for (
    const separator
    of separators
  ) {
    const index =
      before.lastIndexOf(
        separator,
      );

    if (
      index >= 0 &&
      index +
        separator.length >
        startIndex
    ) {
      startIndex =
        index +
        separator.length;
    }
  }

  return before
    .slice(startIndex)
    .slice(-100)
    .trim();
}

function isEnglishNegated(
  prefix: string,
): boolean {
  return (
    /\b(no|not|without|deny|denies|denied)\b/i.test(
      prefix,
    ) ||
    /\b(don't|dont|do not|doesn't|doesnt|does not|didn't|didnt|did not)\s+(have|feel|experience)\b/i.test(
      prefix,
    )
  );
}

function isArabicNegated(
  prefix: string,
): boolean {
  return /(لا\s*(أعاني|اعاني|أشعر|اشعر|يوجد|لدي|عندي)|ما\s*(عندي|لدي|أشعر|اشعر)|بدون|ليس\s*لدي|ليس\s*عندي)/u.test(
    prefix,
  );
}

function hasAffirmedEnglishMention(
  text: string,
  pattern: RegExp,
): boolean {
  const flags =
    pattern.flags.includes("g")
      ? pattern.flags
      : `${pattern.flags}g`;

  const matcher =
    new RegExp(
      pattern.source,
      flags,
    );

  for (
    const match
    of text.matchAll(matcher)
  ) {
    const index =
      match.index ?? 0;

    const prefix =
      clauseBefore(
        text,
        index,
      );

    if (
      !isEnglishNegated(
        prefix,
      )
    ) {
      return true;
    }
  }

  return false;
}

function hasAffirmedArabicMention(
  text: string,
  pattern: RegExp,
): boolean {
  const flags =
    pattern.flags.includes("g")
      ? pattern.flags
      : `${pattern.flags}g`;

  const matcher =
    new RegExp(
      pattern.source,
      flags,
    );

  for (
    const match
    of text.matchAll(matcher)
  ) {
    const index =
      match.index ?? 0;

    const prefix =
      clauseBefore(
        text,
        index,
      );

    if (
      !isArabicNegated(
        prefix,
      )
    ) {
      return true;
    }
  }

  return false;
}

function hasChestPain(
  text: string,
): boolean {
  const english =
    /\b(chest\s+(pain|pan|pressure|tightness|discomfort)|pain\s+(in|inside)\s+(my\s+|the\s+)?chest)\b/i;

  const arabic =
    /(ألم|الم|وجع|ضغط|ثقل|ضيق)\s*(في\s*)?(الصدر|صدري)/u;

  return (
    hasAffirmedEnglishMention(
      text,
      english,
    ) ||
    hasAffirmedArabicMention(
      text,
      arabic,
    )
  );
}

function hasBreathingDifficulty(
  text: string,
): boolean {
  const english =
    /\b(shortness\s+of\s+breath|difficulty\s+(breathing|breath)|trouble\s+(breathing|breath)|hard\s+to\s+(breathe|breath)|can't\s+(breathe|breath)|cant\s+(breathe|breath)|cannot\s+(breathe|breath)|can\s+not\s+(breathe|breath)|unable\s+to\s+(breathe|breath)|not\s+able\s+to\s+(breathe|breath))\b/i;

  const arabic =
    /(ضيق|صعوبة)\s*(في\s*)?(التنفس|النفس)|لا\s*(أستطيع|استطيع|اقدر|أقدر)\s*(على\s*)?(التنفس|النفس)/u;

  /*
   * Expressions such as "can't breathe"
   * contain their own negative grammar,
   * but semantically they AFFIRM breathing
   * difficulty.
   *
   * Therefore they are matched as a complete
   * symptom phrase rather than interpreted as
   * negated symptoms.
   */
  return (
    english.test(
      text,
    ) ||
    hasAffirmedArabicMention(
      text,
      arabic,
    )
  );
}

function hasPossibleStrokePattern(
  text: string,
): boolean {
  const englishWeakness =
    /\b(weakness|numbness)\b.*\b(one side|one-sided|left side|right side)\b|\b(one side|one-sided|left side|right side)\b.*\b(weakness|numbness)\b/i;

  const englishSpeech =
    /\b(slurred speech|difficulty speaking|trouble speaking|can't speak|cannot speak)\b/i;

  const arabicWeakness =
    /(ضعف|خدر|تنميل).*(جهة|جانب).*(واحد|الأيسر|الايسر|الأيمن|الايمن)|(جهة|جانب).*(واحد|الأيسر|الايسر|الأيمن|الايمن).*(ضعف|خدر|تنميل)/u;

  const arabicSpeech =
    /(صعوبة|مشكلة).*(الكلام|التحدث)|كلام.*(غير واضح|متداخل)|لا\s*(أستطيع|استطيع)\s*(الكلام|التحدث)/u;

  return (
    (
      englishWeakness.test(
        text,
      ) &&
      englishSpeech.test(
        text,
      )
    ) ||
    (
      arabicWeakness.test(
        text,
      ) &&
      arabicSpeech.test(
        text,
      )
    )
  );
}

function isUnresponsive(
  text: string,
): boolean {
  const english =
    /\b(unconscious|unresponsive|not responding|won't wake up|will not wake up)\b/i;

  const arabic =
    /(فاقد\s*الوعي|لا\s*يستجيب|لا\s*تستجيب|لا\s*يستيقظ|لا\s*تستيقظ|مغمى\s*عليه|مغمى\s*عليها)/u;

  return (
    english.test(
      text,
    ) ||
    arabic.test(
      text,
    )
  );
}

function hasSevereBleeding(
  text: string,
): boolean {
  const english =
    /\b(severe|heavy|uncontrolled)\s+bleeding\b|\bbleeding\s+(heavily|a lot|won't stop|will not stop)\b/i;

  const arabic =
    /(نزيف\s*(شديد|غزير|لا\s*يتوقف)|نزف\s*(شديد|غزير|لا\s*يتوقف))/u;

  return (
    english.test(
      text,
    ) ||
    arabic.test(
      text,
    )
  );
}

export function screenForUrgency(
  message: string,
  requestedLocale?: Locale,
): SafetyResult {
  const locale =
    determineLocale(
      message,
      requestedLocale,
    );

  const text =
    normalizeText(
      message,
    );

  if (
    hasChestPain(text) &&
    hasBreathingDifficulty(
      text,
    )
  ) {
    return {
      status:
        "urgent",

      locale,

      matchedRule:
        "chest_pain_with_breathing_difficulty",

      message:
        urgentMessage(
          locale,
        ),
    };
  }

  if (
    hasBreathingDifficulty(
      text,
    )
  ) {
    return {
      status:
        "urgent",

      locale,

      matchedRule:
        "breathing_difficulty",

      message:
        urgentMessage(
          locale,
        ),
    };
  }

  if (
    hasChestPain(
      text,
    )
  ) {
    return {
      status:
        "urgent",

      locale,

      matchedRule:
        "chest_pain",

      message:
        urgentMessage(
          locale,
        ),
    };
  }

  if (
    hasPossibleStrokePattern(
      text,
    )
  ) {
    return {
      status:
        "urgent",

      locale,

      matchedRule:
        "possible_stroke_pattern",

      message:
        urgentMessage(
          locale,
        ),
    };
  }

  if (
    isUnresponsive(
      text,
    )
  ) {
    return {
      status:
        "urgent",

      locale,

      matchedRule:
        "unresponsive",

      message:
        urgentMessage(
          locale,
        ),
    };
  }

  if (
    hasSevereBleeding(
      text,
    )
  ) {
    return {
      status:
        "urgent",

      locale,

      matchedRule:
        "severe_bleeding",

      message:
        urgentMessage(
          locale,
        ),
    };
  }

  return {
    status:
      "clear",

    locale,
  };
}