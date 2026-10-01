import type { Locale } from "./schemas";

export type SafetyRuleId =
  | "chest_pain_with_breathing_difficulty"
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

const arabicCharacterPattern = /[\u0600-\u06ff]/;

function normalizeText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function determineLocale(
  message: string,
  requestedLocale?: Locale,
): Locale {
  if (requestedLocale) {
    return requestedLocale;
  }

  return arabicCharacterPattern.test(message)
    ? "ar"
    : "en";
}

function hasEnglishChestAndBreathingPattern(
  text: string,
): boolean {
  const chestPattern =
    /\b(chest pain|chest pressure|pressure in (my )?chest)\b/;

  const breathingPattern =
    /\b(difficulty breathing|shortness of breath|can't breathe|cannot breathe|struggling to breathe)\b/;

  return (
    chestPattern.test(text) &&
    breathingPattern.test(text)
  );
}

function hasArabicChestAndBreathingPattern(
  text: string,
): boolean {
  const chestPattern =
    /(ألم الصدر|الم في الصدر|وجع الصدر|ضغط في الصدر)/;

  const breathingPattern =
    /(صعوبة في التنفس|صعوبة التنفس|ضيق التنفس|لا أستطيع التنفس|لا استطيع التنفس)/;

  return (
    chestPattern.test(text) &&
    breathingPattern.test(text)
  );
}

function hasEnglishStrokePattern(
  text: string,
): boolean {
  const weaknessPattern =
    /\b(weakness|numbness)\b/;

  const sidePattern =
    /\b(one side|left side|right side)\b/;

  const speechPattern =
    /\b(slurred speech|trouble speaking|difficulty speaking|can't speak|cannot speak)\b/;

  return (
    weaknessPattern.test(text) &&
    sidePattern.test(text) &&
    speechPattern.test(text)
  );
}

function hasArabicStrokePattern(
  text: string,
): boolean {
  const weaknessPattern =
    /(ضعف|خدر|تنميل)/;

  const sidePattern =
    /(جهة واحدة|جانب واحد|الجهة اليمنى|الجهة اليسرى|الجانب الأيمن|الجانب الايسر|الجانب الأيسر)/;

  const speechPattern =
    /(صعوبة الكلام|صعوبة في الكلام|كلام غير واضح|لا يستطيع الكلام|لا أستطيع الكلام|لا استطيع الكلام)/;

  return (
    weaknessPattern.test(text) &&
    sidePattern.test(text) &&
    speechPattern.test(text)
  );
}

function hasEnglishUnresponsivePattern(
  text: string,
): boolean {
  return /\b(unconscious|unresponsive|not waking up|won't wake up|will not wake up)\b/.test(
    text,
  );
}

function hasArabicUnresponsivePattern(
  text: string,
): boolean {
  return /(فاقد الوعي|فقد الوعي|لا يستيقظ|لا يستجيب)/.test(
    text,
  );
}

function hasEnglishSevereBleedingPattern(
  text: string,
): boolean {
  return /\b(severe bleeding|heavy bleeding|bleeding (that )?(won't|will not|doesn't|does not) stop)\b/.test(
    text,
  );
}

function hasArabicSevereBleedingPattern(
  text: string,
): boolean {
  return /(نزيف شديد|نزيف لا يتوقف|النزيف لا يتوقف)/.test(
    text,
  );
}

function getUrgentMessage(locale: Locale): string {
  if (locale === "ar") {
    return "الأعراض التي وصفتها تطابق قاعدة أمان عاجلة في هذا النموذج التجريبي. يرجى طلب تقييم طبي عاجل الآن أو التواصل مع خدمات الطوارئ المحلية. هذا النظام لا يقدم تشخيصًا طبيًا.";
  }

  return "The symptoms you described match an urgent safety rule in this prototype. Please seek urgent in-person medical assessment now or contact local emergency services. This system does not provide a medical diagnosis.";
}

export function screenForUrgency(
  message: string,
  requestedLocale?: Locale,
): SafetyResult {
  const text = normalizeText(message);

  const locale = determineLocale(
    message,
    requestedLocale,
  );

  const rules: Array<{
    id: SafetyRuleId;
    matches: boolean;
  }> = [
    {
      id: "chest_pain_with_breathing_difficulty",
      matches:
        hasEnglishChestAndBreathingPattern(text) ||
        hasArabicChestAndBreathingPattern(text),
    },
    {
      id: "possible_stroke_pattern",
      matches:
        hasEnglishStrokePattern(text) ||
        hasArabicStrokePattern(text),
    },
    {
      id: "unresponsive",
      matches:
        hasEnglishUnresponsivePattern(text) ||
        hasArabicUnresponsivePattern(text),
    },
    {
      id: "severe_bleeding",
      matches:
        hasEnglishSevereBleedingPattern(text) ||
        hasArabicSevereBleedingPattern(text),
    },
  ];

  const matchedRule = rules.find(
    (rule) => rule.matches,
  );

  if (!matchedRule) {
    return {
      status: "clear",
      locale,
    };
  }

  return {
    status: "urgent",
    locale,
    matchedRule: matchedRule.id,
    message: getUrgentMessage(locale),
  };
}