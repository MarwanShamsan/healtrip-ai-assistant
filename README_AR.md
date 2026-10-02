# HealTrip AI Patient Decision Assistant

[English](./README.md)

## لماذا بنيت المشروع بهذه الطريقة؟

هذا المستودع يحتوي على الـPrototype الذي نفذته لاختبار HealTrip.

بالنسبة لي، التحدي في المطلوب لم يكن إنشاء Chat UI وربطه بـLLM فقط. الجزء الأهم كان تحديد المسؤوليات: ما الذي أتركه للـAI ليفهمه، وما الذي يجب أن يبقى تحت سيطرة الكود بشكل واضح، وكيف أتأكد أن معلومات الأطباء والمستشفيات لا يمكن أن يتم اختلاقها من النموذج.

المبدأ الذي بنيت عليه المشروع هو:

> **الـAI يفهم ماذا يقصد المستخدم، لكن التطبيق هو الذي يحدد ما الذي يُسمح للـAI أن يفعله.**

لهذا السبب يستطيع النظام فهم العربية والإنجليزية، متابعة سياق المحادثة، طرح أسئلة توضيحية، وتحديد متى يحتاج للبحث عن Provider. لكنه لا يستطيع الوصول مباشرة إلى قاعدة البيانات، ولا تنفيذ SQL، ولا اختلاق اسم طبيب، ولا تجاوز مسار الحالات العاجلة.

أي طبيب أو مستشفى يظهر للمستخدم يأتي من PostgreSQL من خلال Tools محددة ومتحقق من مدخلاتها.

**Live Demo:** https://healtrip.aicrafters.tech  
**GitHub:** https://github.com/MarwanShamsan/healtrip-ai-assistant

> جميع بيانات الأطباء والمستشفيات الحالية Fictional Demo Data وليست بيانات حقيقية لمقدمي خدمات طبية.

---

# ما الذي يوضحه الـPrototype؟

النسخة الحالية تحتوي على:

- Next.js / React Chat UI
- محادثة بالعربية والإنجليزية
- RTL وLTR
- فهم Semantic بدل الاعتماد على Keyword Matching فقط
- Clarification Questions
- Explicit Conversation State
- Deterministic Urgent Safety Screening
- Doctor Search
- Hospital Search
- Emergency-capable Hospital Filtering
- Prisma + PostgreSQL
- Neon PostgreSQL
- Typed Zod Schemas
- Provider Grounding
- Fail-Closed Provider Behavior
- Responsive UI للجوال والكمبيوتر
- Reservation / Visit Summary Prototype مع Review وConsent

تعمدت ألا أحول المشروع إلى Diagnosis Engine أو Booking Platform كامل أو EHR لأن هذا خارج نطاق الاختبار.

---

# Architecture

مسار الطلب الرئيسي بسيط ومباشر:

```text
Browser / Chat UI
        ↓
POST /api/chat
        ↓
Request Validation
        ↓
Deterministic Safety Screening
        ↓
AI Conversation / Clinical Routing
        ↓
Clarification عند الحاجة
        ↓
تحديد Next Step
        ↓
هل نحتاج Provider؟
        ↓
Approved Tool فقط
        ↓
Provider Service
        ↓
Prisma
        ↓
PostgreSQL
        ↓
Structured Provider Records
        ↓
Grounding Check
        ↓
Provider Cards في الواجهة
```

لم أبنِ Backend منفصل بـNestJS لأن حجم المشروع لا يحتاج ذلك. Next.js Route Handlers كانت كافية لإبقاء المشروع Full-Stack في Deployment واحد، مع الحفاظ على فصل واضح بين UI وAI وTools وDatabase.

إذا كبر النظام لاحقًا وأصبح فيه Integrations كثيرة أو Background Jobs أو فرق متعددة، عندها سيكون فصل الـBackend قرارًا منطقيًا.

---

# AI Design

## Thin LLM, Strong Application

أستخدم الـLLM في الأشياء التي يحتاج فيها النظام إلى فهم اللغة الطبيعية:

- فهم نية المستخدم
- العربية والإنجليزية
- التعامل مع الأخطاء الإملائية والصياغات المختلفة
- طرح Clarification مناسب
- استخراج Structured Clinical Context
- فهم إذا كان المستخدم يطلب Doctor أو Hospital أو يغير المدينة أو يسأل Follow-up
- صياغة الرد الطبيعي

لكنني لا أستخدمه كطبقة ثقة في:

- SQL
- Database Permissions
- Provider Truth
- Urgent Safety Enforcement
- Tool Registration
- Validation
- Consent
- Provider Rendering

هذه الأشياء تبقى في الكود.

---

# Conversation State

لا أعتمد فقط على Raw Chat History.

هناك State Structured يحتوي على معلومات مثل:

```text
phase
responseLanguage
preferredName
careRecommendation
providerType
specialty
city
awaiting
lastSearch
lastClinicalSummary
lastRecommendationRationale
lastRecommendationMessage
```

هذا يسمح للمحادثة أن تكون Workflow حقيقي.

مثال:

```text
المستخدم يشرح الحالة
→ النظام يسأل سؤال توضيحي
→ المستخدم يجيب
→ النظام يحدد أن Provider مطلوب
→ يطلب المدينة
→ المستخدم يذكر المدينة
→ Tool Search
→ Provider Card
```

هذا أيضًا يجعل الـDebugging أوضح من الاعتماد على LLM ليعيد فهم كل المحادثة من الصفر في كل Request.

---

# Safety Routing

مسار الحالات العاجلة يحدث قبل Open-Ended LLM Reasoning.

لدي مجموعة صغيرة من Deterministic Urgent Rules.

إذا تطابقت الرسالة مع أحدها، يدخل النظام في Urgent State ولا يُسمح للـLLM بأن يخفضها إلى Routine Flow.

```text
User Message
    ↓
Urgent Rule Match
    ↓
Urgent State
    ↓
Urgent In-Person Guidance
    ↓
طلب المدينة إذا لم تكن معروفة
    ↓
البحث عن Emergency-capable Hospital إذا كانت المدينة معروفة
```

هذه ليست Clinically Validated Triage Rules. هي فقط لإظهار أن Safety-Critical Routing يجب ألا يعتمد بالكامل على Generative Model.

الـPrototype لا يشخّص المرض ولا يدعي معرفة سبب الأعراض.

---

# Provider Tools

الوصول إلى بيانات Providers محصور في ثلاث Tools:

```text
search_doctors
search_hospitals
get_provider_details
```

مثال Doctor Search:

```ts
{
  specialty?: string;
  city?: string;
  language?: "ar" | "en";
  hospitalId?: string;
  limit?: number;
}
```

مثال Hospital Search:

```ts
{
  city?: string;
  specialty?: string;
  emergencyAvailable?: boolean;
  limit?: number;
}
```

مثال Provider Details:

```ts
{
  providerType: "doctor" | "hospital";
  providerId: string;
}
```

كل Tool تتحقق من مدخلاتها قبل الوصول إلى Provider Service.

الـLLM لا يمكنه إنشاء Tool جديدة ولا إرسال SQL عشوائي.

---

# كيف منعت Provider Hallucination؟

هذه من أهم نقاط المشروع.

لم أعتمد فقط على Prompt يقول:

```text
Do not invent providers.
```

لأن الـPrompt وحده ليس Security Boundary.

المسار الفعلي هو:

```text
LLM يقرر أن Provider Data مطلوبة
        ↓
Allow-listed Tool
        ↓
Zod Validation
        ↓
Provider Service
        ↓
Prisma
        ↓
PostgreSQL
        ↓
Structured Result
        ↓
تخزين Provider IDs في Current Search State
        ↓
UI تعرض Structured Provider Data
```

المعلومات التالية لا تأتي من الـLLM:

- Provider Name
- Specialty
- Hospital
- City
- Country
- Address
- Languages
- Emergency Availability
- Provider ID

إذا لم توجد نتيجة في قاعدة البيانات، يرجع النظام No Results بدل اختلاق بديل.

---

# Database

أستخدم PostgreSQL مع Prisma.

## Hospital

```text
id
name
city
country
address
emergencyAvailable
languages[]
createdAt
updatedAt
```

## Doctor

```text
id
name
specialty
city
languages[]
bio
hospitalId
createdAt
updatedAt
```

العلاقة:

```text
Hospital 1 ───── N Doctor
```

الـSeed الحالي يحتوي Demo Providers في Riyadh وJeddah وDammam، مع تخصصات مثل Cardiology وGeneral Medicine وNeurology وOrthopedics وDermatology وENT.

هذا الحجم كافٍ لإثبات البحث والعلاقات بدون Overengineering.

---

# Reservation / Visit Summary

أضفت Flow صغير بعد ظهور Grounded Provider.

المستخدم يستطيع إعداد Summary مختصر:

```text
Grounded Provider Card
    ↓
Prepare Summary
    ↓
Relevant Symptoms / Clinical Information
    ↓
User Review / Edit
    ↓
Reservation / Reference عند الحاجة
    ↓
Preview
    ↓
Explicit Consent
    ↓
Ready to Share
```

الـPrototype لا يرسل البيانات فعليًا إلى Provider حقيقي.

الهدف هو إظهار:

- Data Minimization
- Provider Grounding
- User Review
- Explicit Consent
- Integration Boundary واضحة للمستقبل

في Production هذا يحتاج Authentication وSecure Provider APIs وAudit Logs وConsent Records وEncryption وRetention Policies وCompliance Review.

---

# Security

## Secrets

المشروع يعتمد على Environment Variables مثل:

```text
DATABASE_URL
DIRECT_URL
GROQ_API_KEY
GROQ_MODEL
```

`.env.local` غير مرفوع إلى Git.

`.env.example` يوضح أسماء المتغيرات المطلوبة بدون Secrets.

## Database Boundary

الـLLM لا يملك Database Credentials ولا ينفذ Raw SQL.

كل الوصول يمر عبر Application Code ثم Prisma.

## Validation

يتم التحقق من:

- Chat Requests
- Tool Arguments
- Provider IDs
- Share Requests
- Structured LLM Output

أي Structured Output غير صالح يتم رفضه.

## Prompt Injection

User Input يعتبر Untrusted.

المستخدم لا يستطيع من خلال Prompt أن:

- ينشئ Tool جديدة
- ينفذ SQL
- يقرأ Environment Variables
- يعطل Grounding
- يفرض Provider غير موجود على الـUI

## Logging

في Production سأركز على Technical Metadata مثل request ID وtool name وlatency وerror category، ولن أحفظ Health-Sensitive Conversation Content بدون ضرورة.

## Rate Limiting

لم أبنِ Production-Grade Rate Limiting لأن الاختبار Time-Boxed.

سأضيفه على API/Edge Layer قبل Production.

---

# Error Handling

التطبيق مصمم Fail Closed.

### Invalid Input
يرفضه Validation.

### Invalid Tool Arguments
ترجع Tool Error متحكم بها.

### Database Unavailable
يفشل البحث بدون اختلاق Provider.

### No Results
يتم إخبار المستخدم بوضوح أنه لا توجد نتيجة Demo مطابقة.

### Provider Not Found
يرجع Controlled Not Found Result.

### LLM/API Failure
يظهر Retry/Fallback مناسب.

### Unexpected Structured Model Output
يفشل Parsing بدل قبول بيانات غير موثوقة.

### Share Validation Failure
لا يتم اعتبار الـSummary جاهزًا للمشاركة.

---

# العربية والإنجليزية

نفس Architecture تعمل للغتين.

```text
I need a cardiologist in Riyadh.
```

و:

```text
أحتاج طبيب قلب في الرياض
```

كلاهما يمران عبر نفس:

```text
Semantic Routing
→ Validation
→ Tool
→ PostgreSQL
→ Grounded Result
```

الواجهة تغير الاتجاه حسب اللغة.

---

# التشغيل محليًا

```bash
git clone https://github.com/MarwanShamsan/healtrip-ai-assistant.git
cd healtrip-ai-assistant
npm install
```

أنشئ `.env.local`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
GROQ_API_KEY="..."
GROQ_MODEL="qwen/qwen3.8-27b"
```

ثم:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run db:check
npm run tools:check
npm run dev
```

Production:

```bash
npm run lint
npm run build
npm run start
```

الـProduction Build الحالي يستخدم Webpack لأن بيئة Hostinger واجهت Turbopack/PostCSS subprocess panic. استخدمت Next.js Webpack fallback بدل إضاعة وقت الاختبار على Bundler Issue خاصة ببيئة Deployment.

---

# Deployment

```text
GitHub
   ↓
Hostinger Business
   ↓
Next.js
   ├── Groq API
   └── Prisma
        ↓
     Neon PostgreSQL
```

---

# Demo Scenarios

## Clarification

```text
I do not feel well.
```

يجب أن يسأل النظام سؤالًا مناسبًا بدل التخمين.

## Urgent

```text
I feel chest pain.
```

يتم تشغيل Deterministic Safety Flow أولًا.

## Doctor Search

```text
I need a cardiologist in Riyadh.
```

```text
Semantic Routing
→ search_doctors
→ PostgreSQL
→ Grounded Doctor Card
```

## Hospital Search

```text
I need an emergency hospital in Jeddah.
```

```text
search_hospitals
→ emergencyAvailable = true
→ PostgreSQL
→ Hospital Card
```

## No Results

طلب مدينة غير موجودة في Demo Data يجب أن يرجع No Result بدون اختلاق Provider.

## Arabic

```text
أحتاج طبيب قلب في الرياض
```

يجب أن يكون الرد عربي/RTL مع Provider قادم من Database.

---

# لماذا لم أستخدم RAG؟

المشكلة الأساسية هنا هي Patient Navigation وProvider Search.

لا يوجد سبب لإضافة Vector Database لمجرد أن المشروع يستخدم AI.

إذا أصبح HealTrip مستقبلًا يجيب اعتمادًا على Clinical Guidelines موثوقة، وقتها يمكن إضافة RAG مبني على Vetted Sources.

---

# لماذا لم أستخدم Multi-Agent System؟

لأن Workflow الحالي يمكن تمثيله بشكل واضح من خلال Orchestrator واحد مع State وStructured LLM Calls.

Multi-Agent Architecture كانت ستزيد التعقيد وتقلل وضوح المشروع بدون فائدة حقيقية في هذا الاختبار.

---

# لماذا لم أستخدم NestJS Backend منفصل؟

لأن Next.js Route Handlers كافية لنطاق المشروع الحالي.

فصل الـBackend يصبح منطقيًا عندما يكبر حجم المنتج، وليس لمجرد إضافة طبقة أخرى في Prototype.

---

# Current Limitations

هذا Prototype تقني، لذلك لا يحتوي على:

- Real Provider Data
- Real Booking
- Authentication
- Payments
- Insurance
- EHR
- Persistent Medical Records
- Real Provider Messaging
- Clinically Validated Triage
- Production Healthcare Compliance
- Full Observability
- Production Rate Limiting
- Live Provider Availability

هذه Scope Decisions مقصودة.

---

# ماذا سأفعل لو انتقل المشروع إلى Production؟

الأولوية ستكون:

1. Authentication / Authorization
2. Server-Side Session State
3. Consent Management
4. Real Provider Integrations
5. Appointment Availability
6. Secure Provider Sharing
7. Audit Logs
8. Observability
9. Rate Limiting
10. Clinically Reviewed Safety Rules
11. Multilingual Evaluation
12. Encryption / Retention Policies
13. Privacy / Compliance Review
14. Human Escalation
15. Agent Regression Tests

---

# الخلاصة

أهم جزء أردت توضيحه في هذا المشروع ليس شكل الـChat نفسه.

الجزء الأهم هو Trust Boundary:

```text
AI يفهم المحادثة
        ↓
Application تتحقق من القرار وتتحكم في التنفيذ
        ↓
فقط Tools مسموحة تصل إلى Provider Data
        ↓
PostgreSQL هي Source of Truth
        ↓
Structured Results يتم التحقق منها
        ↓
UI تعرض Grounded Provider Information
```

بهذا الشكل يبقى النظام Conversational، لكن الأجزاء الحساسة تظل واضحة وقابلة للمراجعة والاختبار.

---

**Marwan Shamsan**  
HealTrip AI Patient Decision Assistant — Technical Assessment
