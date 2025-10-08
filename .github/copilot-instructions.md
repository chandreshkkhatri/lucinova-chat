# Copilot instructions for lucidity

## Architecture & runtime

- Next.js 15 App Router with React 19 RC drives both server and client components; routes live under `app/` (chat UI in `(chat)`, auth in `(auth)`).
- Real-time chat relies on the Vercel `ai` SDK; `/app/(chat)/api/chat` streams Gemini responses and persists messages to Mongo via helpers in `db/queries.ts`.
- Thread replies hit `/app/(chat)/api/thread`, which rebuilds context by reading the parent message and four previous top-level messages with `DbMessage` queries.
- Authentication is NextAuth credentials-only; `app/(auth)/auth.ts` pulls users from Mongo, hashes passwords with `bcrypt-ts`, and mirrors Mongo `_id` into session tokens.

## Data layer conventions

- Always call `ensureConnection()` from `db/connection.ts` before touching Mongoose models; it caches the connection across hot reloads.
- Reuse helpers from `db/queries.ts` for CRUD to keep ObjectId handling consistent (`lean()` + manual `id` string fields) and to keep `Chat.lastMsgAt` refreshed.
- Creating a chat must respect the auto-provisioned AI bot user (`ai@assistant.local`); reuse the logic in `/api/chat` instead of duplicating it.
- When adding queries, prefer `lean()` for reads and update related aggregates (e.g., thread counts) so SWR hooks like `useThreadCount` stay accurate.

## Client patterns

- `components/custom/chat.tsx` is the canonical chat surface; it wraps `useChat` with `api` override (`/api/chat` vs `/api/thread`) and maintains thread state for `ThreadView`.
- Selection-to-thread flows come from `EnhancedMessage` (`components/custom/enhanced-message.tsx`) which emits `onAskTara` when text is highlighted; any message formatting changes must preserve that callback.
- Thread UI fetches via SWR (`useThreadCount`) and modal rendering (`ThreadView`); if you add thread data, update both the API response mappers and the SWR fallback.
- UI primitives come from `components/ui` (shadcn); prefer existing variants and the `cn` helper from `lib/utils.ts`.

## Payments & subscriptions

- Cashfree integration sits in `app/api/payment/**`; `lib/cashfree.ts` builds the SDK client and requires `CASHFREE_*` env vars.
- `/api/payment/webhook` verifies HMAC signatures with `CASHFREE_WEBHOOK_SECRET`, records orders via `recordPaymentOnce`, then upgrades users with `activateProSubscriptionByEmail`.
- Client checkout flows go through `PaymentModal` and `CashfreePaymentButton`; they expect `/api/payment/create-order` to return `paymentSessionId`.

## Developer workflow

- Install with `pnpm install`; run the app using `pnpm dev --turbo`. Production build is `pnpm build` followed by `pnpm start`.
- Lint with `pnpm lint`; no automated tests exist, so rely on lint + manual QA.
- Prepare Mongo indexes locally by running `pnpm migrate-indexes` (see `scripts/migrateIndexes.js`).
- Required env vars are documented in `.env.example`; you need `MONGODB_URI`, `AUTH_SECRET`, and `GOOGLE_GENERATIVE_AI_API_KEY` to boot locally.

## Extra tips

- `middleware.ts` applies NextAuth guards to almost everything except payment + auth session endpoints; keep new routes either behind auth or explicitly whitelisted.
- `lib/config.ts` controls model naming and pricing; read from `NEXT_PUBLIC_MODEL_DISPLAY_MODE` and `NEXT_PUBLIC_PRO_MONTHLY_PRICE_INR` instead of hard-coding.
- Streaming handlers (`streamText`) return `toDataStreamResponse()`. If you add side effects, use the `onFinish` callback as shown in `/api/chat` and `/api/thread` so the stream stays uninterrupted.
