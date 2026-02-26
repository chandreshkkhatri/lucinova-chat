# Agent Context for Lucidity

## What This Project Is

Lucidity is a Slack-style AI chat app (Next.js 15 + React 19 + MongoDB) powered by Google Gemini with threaded conversations, real-time streaming, and a Pro subscription tier via Razorpay/Cashfree payments.

## Unique Development Practices

### Spec-Driven Development
All non-trivial features start as a spec file **before any code is written**. The workflow is:
```
[DRAFT] → [REVIEW] → [APPROVED] → [IMPLEMENTED] → [DEPRECATED]
```
- Specs live in `specs/features/`, `specs/api/`, `specs/components/`, `specs/database/`
- Use `pnpm spec:new` to scaffold a new spec from `specs/TEMPLATE.md`
- Validate specs with `pnpm validate-specs` before marking `[REVIEW]`
- **Do not implement a feature before its spec is `[APPROVED]`**
- See `docs/SPEC_DRIVEN_DEVELOPMENT.md` for the full guide

### Agile Sprints (tracked in ROADMAP.md)
- Work is organised into named sprints, each with a clear status and deliverables
- Sprint 1 (UX Refinement & Personalization) — ✅ Completed 2026-02-23
- Sprint 2 (Parity & Multimodality) — 📅 Planned
- Sprint 3 (Lucidity Differentiators) — 📅 Planned
- Sprint 4 (Collaboration & Ecosystem) — 📅 Planned
- Always check `ROADMAP.md` to understand current sprint scope before picking up work

## Key Architectural Rules

- Call `ensureConnection()` before touching any Mongoose model
- Use helpers in `db/queries.ts` for all DB access (keeps ObjectId handling consistent)
- Streaming handlers must return `toDataStreamResponse()`; side effects go in `onFinish`
- New routes need auth via `middleware.ts` or an explicit whitelist
- Read pricing/model names from `lib/config.ts`, never hard-code them

## Active Specs
See `specs/features/` for all current feature specs:
- `chat-threading.md`, `dynamic-suggestions.md`, `streaming-optimizations.md`, `pinned-chats.md`, `edit-regenerate.md`, `chat-titles.md`, `mobile-selection-ux.md`, `chat-readability-ui.md`
