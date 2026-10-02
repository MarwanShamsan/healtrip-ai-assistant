# HealTrip AI Patient Decision Assistant

[العربية](./README_AR.md)

## Why I built it this way

This repository is my technical assessment prototype for HealTrip.

The assignment was not simply to build a chat box connected to an LLM. The interesting part was deciding which responsibilities should belong to the model, which responsibilities should remain in normal application code, and how to make provider results trustworthy.

My main rule for the project was:

> **The AI understands the user. The application controls what the AI is allowed to do.**

That decision shaped the whole architecture.

The assistant can understand English and Arabic, ask follow-up questions, maintain conversation context, classify a high-level next step, and decide when provider data is needed. However, it cannot directly query the database, write SQL, invent doctors, or override the urgent-safety path.

All doctor and hospital information shown in the UI comes from PostgreSQL through validated tools.

**Live demo:** https://healtrip.aicrafters.tech  
**Repository:** https://github.com/MarwanShamsan/healtrip-ai-assistant

> The current doctors and hospitals are fictional demo data. They are not real medical directory information.

---

## What the prototype demonstrates

The current version includes:

- Next.js / React chat UI
- English and Arabic conversations
- RTL and LTR layouts
- semantic conversation routing rather than simple phrase matching
- clarification questions
- explicit conversation state
- deterministic urgent-symptom screening
- doctor search
- hospital search
- emergency-capable hospital filtering
- Prisma + PostgreSQL provider storage
- Neon hosted PostgreSQL
- typed Zod schemas for model/tool/API boundaries
- provider grounding
- fail-closed provider behavior
- mobile-responsive provider and summary cards
- a prototype reservation/visit summary flow with review and consent

It intentionally does **not** try to be a diagnosis engine, full booking platform, EHR, insurance system, or production healthcare platform.

---

# Architecture

I kept the request path intentionally easy to explain:

```text
Browser / Chat UI
        ↓
POST /api/chat
        ↓
Request validation
        ↓
Deterministic safety screening
        ↓
AI conversation / clinical routing
        ↓
Clarification if required
        ↓
Determine high-level next step
        ↓
Provider needed?
        ↓
Approved tool only
        ↓
Provider service
        ↓
Prisma
        ↓
PostgreSQL
        ↓
Validated structured records
        ↓
Grounding check
        ↓
UI provider cards
```

I did not create a separate NestJS backend because the prototype did not need one. Next.js Route Handlers were enough to keep the frontend and backend in one deployable application while still separating the important concerns in code.

If the system grew into a larger product with several integrations, background jobs, authentication domains, and independent teams, I would consider splitting the API/agent layer into a dedicated backend service later.

---

# AI design

## Thin LLM, strong application

I use the LLM for tasks where natural-language understanding is useful:

- understanding what the user means
- handling Arabic and English
- understanding misspellings and conversational wording
- asking focused clarification questions
- extracting structured clinical context
- deciding whether the user is asking for a doctor, hospital, location change, follow-up explanation, or general conversation
- generating natural-language replies

I do **not** rely on the LLM for:

- SQL
- database permissions
- provider truth
- urgent-rule enforcement
- tool registration
- validation
- consent enforcement
- trusted provider rendering

Those are controlled by application code.

This avoids the common pattern where the prompt contains many rules but the model is still effectively trusted with the entire system.

---

## Conversation state

The application carries structured conversation state between requests.

Examples of state fields include:

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

That lets the conversation behave as a workflow rather than a series of unrelated prompts.

For example:

```text
User describes a concern
→ assistant asks one useful clarification
→ user answers
→ assessment becomes sufficient
→ assistant asks for city
→ user provides city
→ provider tool runs
→ grounded provider card is shown
```

This is also useful when the user switches language or gives a location in a later message.

---

# Safety routing

Urgent routing happens before open-ended model reasoning.

The prototype has a small deterministic set of urgent warning patterns. If one matches, the system enters an urgent path and the LLM is not allowed to downgrade it into routine navigation.

Example:

```text
User message
    ↓
Urgent deterministic rule matches
    ↓
Urgent state
    ↓
Recommend urgent in-person assessment
    ↓
Ask for city if missing
    ↓
Search emergency-capable hospital if city is known
```

This is intentionally demonstrative rather than clinically complete.

The prototype is **not** a clinically validated triage system and does not diagnose the cause of symptoms.

---

# Provider tools

Provider data is available through only three application tools:

```text
search_doctors
search_hospitals
get_provider_details
```

Typical doctor search input:

```ts
{
  specialty?: string;
  city?: string;
  language?: "ar" | "en";
  hospitalId?: string;
  limit?: number;
}
```

Typical hospital search input:

```ts
{
  city?: string;
  specialty?: string;
  emergencyAvailable?: boolean;
  limit?: number;
}
```

Provider details input:

```ts
{
  providerType: "doctor" | "hospital";
  providerId: string;
}
```

Every tool validates its arguments before reaching the provider service.

The model cannot invent a new tool name and cannot send arbitrary SQL.

---

# How provider hallucination is prevented

This is one of the most important parts of the prototype.

I did not consider a prompt such as “do not invent doctors” to be enough.

The actual trust path is:

```text
LLM decides provider data is needed
        ↓
allow-listed tool
        ↓
Zod input validation
        ↓
provider service
        ↓
Prisma
        ↓
PostgreSQL
        ↓
structured result
        ↓
provider IDs stored in current search state
        ↓
UI renders structured provider data
```

The following facts must come from the database:

- provider name
- specialty
- hospital
- city
- country
- address
- languages
- emergency availability
- provider ID

If a search returns no records, the application returns a no-results response.

It does not ask the LLM to make up alternatives.

---

# Database

The prototype uses PostgreSQL with Prisma.

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

Relationship:

```text
Hospital 1 ───── N Doctor
```

The seed data currently contains fictional providers in Riyadh, Jeddah, and Dammam across specialties such as Cardiology, General Medicine, Neurology, Orthopedics, Dermatology, and ENT.

For this assessment, that is enough to demonstrate relational provider search without overbuilding a large provider-directory schema.

---

# Reservation / visit summary prototype

I added a small follow-up flow after a grounded provider is displayed.

The user can prepare a short summary for a selected doctor or hospital.

The flow is:

```text
Grounded provider card
    ↓
Prepare summary
    ↓
Relevant reported symptom information
    ↓
User reviews/edits it
    ↓
Reservation/reference when applicable
    ↓
Preview
    ↓
Explicit consent
    ↓
Ready to share
```

The prototype does **not** transmit the summary to a real provider.

The point of this feature is to demonstrate how I would handle:

- data minimization
- provider grounding
- user review
- explicit consent
- a future external integration boundary

A production version would need authentication, secure provider APIs, audit logs, formal consent records, retention rules, encryption, and a healthcare privacy/compliance review.

---

# Security decisions

## Secrets

The application uses environment variables such as:

```text
DATABASE_URL
DIRECT_URL
GROQ_API_KEY
GROQ_MODEL
```

`.env.local` is ignored by Git.

`.env.example` documents required keys without containing credentials.

## Database boundary

The LLM never gets database credentials and never sends raw SQL.

Prisma is the application database boundary.

## Validation

I validate external input and structured model/tool output with typed schemas.

Invalid structured output is rejected rather than trusted.

## Prompt injection

A user message cannot:

- create arbitrary tools
- execute SQL
- expose environment variables
- bypass provider grounding
- force untrusted provider cards into the UI

## Logging

For a production version, I would keep operational logs focused on technical metadata such as request ID, tool name, latency, and error category rather than logging unnecessary patient conversation content.

## Rate limiting

I did not build a production-grade rate-limiting service for this time-boxed prototype.

I would add it at the API/edge layer before production.

---

# Error handling

The application is designed to fail closed.

### Invalid input
Rejected by validation.

### Invalid tool arguments
The tool returns a controlled validation error.

### Database unavailable
Provider search fails; no provider is fabricated.

### No provider results
The assistant clearly reports that no matching demo provider was found.

### Missing provider ID
The details tool returns a controlled not-found result.

### LLM/API failure
The user gets a safe retry/fallback response.

### Unexpected structured model output
The parse fails instead of allowing malformed data into the workflow.

### Share validation failure
The summary is not marked ready to share.

---

# Arabic and English

The same architecture handles both languages.

Example:

```text
I need a cardiologist in Riyadh.
```

and:

```text
أحتاج طبيب قلب في الرياض
```

both go through the same routing, validation, tool, and database layers.

The UI changes direction between LTR and RTL as required.

I did not create two separate application flows for the two languages.

---

# Project structure

```text
healtrip-ai-assistant/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   └── share/
│   ├── globals.css
│   └── page.tsx
├── lib/
│   ├── ai/
│   │   ├── agent.ts
│   │   ├── clinical-assessor.ts
│   │   ├── clinical-assessment-schema.ts
│   │   ├── conversation-router.ts
│   │   ├── conversation-state.ts
│   │   ├── prompts.ts
│   │   ├── router-schema.ts
│   │   └── safety.ts
│   ├── db/
│   │   └── prisma.ts
│   ├── tools/
│   │   ├── search-doctors.ts
│   │   ├── search-hospitals.ts
│   │   └── get-provider-details.ts
│   └── share/
│       └── share-schema.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
├── prisma.config.ts
├── .env.example
├── package.json
├── README.md
└── README_AR.md
```

---

# Running locally

```bash
git clone https://github.com/MarwanShamsan/healtrip-ai-assistant.git
cd healtrip-ai-assistant
npm install
```

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
GROQ_API_KEY="..."
GROQ_MODEL="qwen/qwen3.8-27b"
```

Then:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run db:check
npm run tools:check
npm run dev
```

Open:

```text
http://localhost:3000
```

Production verification:

```bash
npm run lint
npm run build
npm run start
```

The current production build uses Webpack because the Hostinger deployment environment produced a Turbopack/PostCSS subprocess panic. I used Next.js's supported Webpack fallback instead of spending assessment time debugging an environment-specific bundler issue.

---

# Deployment

Current deployment:

```text
GitHub
   ↓
Hostinger Business
   ↓
Next.js application
   ├── Groq API
   └── Prisma
        ↓
     Neon PostgreSQL
```

The hosted PostgreSQL schema is the same schema used during local development.

---

# Useful demo scenarios

## Clarification

```text
I do not feel well.
```

The assistant should ask a focused clarification question.

## Urgent flow

```text
I feel chest pain.
```

The deterministic safety path should run before normal AI reasoning.

## Doctor search

```text
I need a cardiologist in Riyadh.
```

Expected path:

```text
semantic routing
→ search_doctors
→ PostgreSQL
→ grounded doctor card
```

## Hospital search

```text
I need an emergency hospital in Jeddah.
```

Expected path:

```text
search_hospitals
→ emergencyAvailable = true
→ PostgreSQL
→ grounded hospital card
```

## No results

Ask for a location not present in the demo dataset.

The system should return no matching demo provider rather than inventing one.

## Arabic

```text
أحتاج طبيب قلب في الرياض
```

The response should be Arabic/RTL and use the same grounded provider workflow.

---

# Why I did not add more infrastructure

## No RAG

The core requirement is provider navigation, not answering from a large medical knowledge corpus.

A vector database would not improve the provider trust boundary.

If the product later needs answers based on vetted medical guidelines, I would consider adding a controlled RAG layer using approved clinical sources.

## No multi-agent system

The workflow is understandable as one orchestrated state machine with a few structured LLM calls.

Multiple autonomous agents would make this prototype harder to reason about and test.

## No separate NestJS backend

For this scope, Next.js Route Handlers were sufficient.

I would split services later only when the product complexity justified it.

---

# Current limitations

This is a technical prototype.

It does not include:

- real provider data
- real appointment booking
- authentication
- payments
- insurance integrations
- EHR integrations
- persistent medical records
- real provider messaging
- clinically validated triage
- production healthcare compliance controls
- complete observability
- full production rate limiting
- live provider availability

These are deliberate scope decisions.

---

# What I would build next

If HealTrip moved toward production, my next priorities would be:

1. authentication and authorization
2. server-managed conversation/session state
3. consent management
4. real provider-directory integrations
5. appointment availability integrations
6. secure provider sharing
7. audit logging
8. observability/tracing
9. rate limiting
10. clinically reviewed safety rules
11. multilingual evaluation
12. encryption and retention policies
13. formal privacy/compliance review
14. human escalation paths
15. automated regression tests for agent behavior

---

# Final note

The main point of the prototype is not the chat UI.

The part I wanted to make clear is the trust boundary:

```text
AI understands the conversation
        ↓
application validates and controls actions
        ↓
only approved tools can access provider data
        ↓
PostgreSQL remains the source of truth
        ↓
structured results are returned
        ↓
the UI displays grounded provider information
```

That gives the prototype enough AI capability to feel conversational while keeping the critical system behavior explicit and reviewable.

---

**Marwan Shamsan**  
HealTrip AI Patient Decision Assistant — Technical Assessment
