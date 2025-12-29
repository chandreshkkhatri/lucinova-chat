# Lucidity - Claude Code Context

## Project Overview

**Lucidity** is a Slack-style AI chat application with threaded conversations powered by Google Gemini. Built with Next.js 15 and featuring real-time streaming responses, persistent chat history, and secure authentication.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19 RC)
- **AI Model**: Google Gemini (2.5-pro & 2.5-flash via @ai-sdk/google)
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: NextAuth.js 5.0 (beta.22)
- **Payment**: Cashfree Payment Gateway
- **Styling**: Tailwind CSS 3.4 + shadcn/ui (Radix UI primitives)
- **AI SDK**: Vercel AI SDK 3.4.9
- **Package Manager**: pnpm 10.12.2

## Project Structure

```
app/
├── (auth)/              # Authentication pages & API
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   └── api/auth/[...nextauth]/
├── (chat)/              # Chat interface & API routes
│   ├── chat/           # Chat UI pages
│   └── api/            # Chat, thread, history endpoints
├── api/                # Global API routes
│   ├── auth/           # Auth endpoints (session, password reset)
│   ├── payment/        # Payment endpoints & webhooks
│   └── user/           # User profile endpoints
├── account/            # Account management
├── payment/            # Payment pages
├── contact/            # Contact page
├── privacy/            # Privacy policy
└── legal/              # Legal pages

components/
├── custom/             # App-specific components
└── ui/                 # Reusable shadcn/ui components

db/
├── models.ts           # MongoDB schemas (User, Chat, Message, etc.)
└── queries.ts          # Database query functions

ai/
├── index.ts            # AI model configuration (Gemini Pro/Flash)
└── custom-middleware.ts # AI middleware

lib/                    # Utility functions
types/                  # TypeScript type definitions
public/                 # Static assets
scripts/                # Utility scripts (e.g., migrateIndexes.js)
docs/                   # copilot documentation. all documentation .md files must go in this directory
```

## Key Features

1. **Threaded Conversations**: Nested replies with context preservation
2. **Real-time Streaming**: AI responses via Vercel AI SDK streaming
3. **Persistent History**: MongoDB-backed chat storage with automatic session management
4. **Secure Authentication**: Email/password auth with NextAuth.js
5. **Pro Plan**: Cashfree payment integration for subscription management
6. **File Uploads**: Vercel Blob storage for file handling
7. **Password Reset**: Forgot/reset password flow
8. **User Profiles**: Account information and settings management

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=****

# Model Display Configuration
NEXT_PUBLIC_MODEL_DISPLAY_MODE=custom  # "custom" (Lucinova) or "original" (Gemini)

# Authentication
AUTH_SECRET=****  # Generate via openssl rand -base64 32

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=****

# Database
MONGODB_URI=****

# Payment (Optional)
NEXT_PUBLIC_PRO_MONTHLY_PRICE_INR=
PRO_MONTHLY_PRICE_INR=
NEXT_PUBLIC_CURRENCY=
```

## Development Commands

```bash
pnpm dev              # Start development server (with Turbo)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm migrate-indexes  # Setup MongoDB indexes
```

## Configuration Files

- **next.config.mjs**: Next.js configuration
- **tailwind.config.ts**: Tailwind CSS configuration
- **tsconfig.json**: TypeScript configuration (ESNext, strict mode, path aliases via @/\*)
- **components.json**: shadcn/ui component configuration
- **.eslintrc.json**: ESLint rules with Prettier integration

## API Routes Overview

### Authentication

- `POST /api/auth/[...nextauth]` - NextAuth.js handler
- `GET/POST /api/auth/session` - Session management
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Complete password reset

### Chat

- `POST /api/chat` - Main chat endpoint (streaming)
- `GET /api/history` - Fetch chat history
- `GET/POST /api/thread` - Thread management
- `GET /api/threads` - List all threads
- `GET /api/threads/count` - Thread count

### User

- `GET/PATCH /api/user/profile` - User profile CRUD
- `GET /api/user/profile-status` - Profile completion status

### Payment

- `POST /api/payment/create-order` - Create Cashfree order
- `POST /api/payment/webhook` - Cashfree webhook handler
- `GET /api/payment/status` - Payment status check
- `GET /api/payment/history` - Payment history

### Files

- `POST /api/files/upload` - File upload to Vercel Blob

## AI Models Configuration

Located in `ai/index.ts`:

- **Primary Model**: Gemini 2.5 Pro (customizable via `GOOGLE_GEMINI_PRIMARY_MODEL`)
- **Fast Model**: Gemini 2.5 Flash (customizable via `GOOGLE_GEMINI_FAST_MODEL`)
- Both wrapped with custom middleware for extended functionality

## Database Models

Key MongoDB collections (see `db/models.ts`):

- **User**: User accounts with auth credentials, profile info, and pro subscription status
- **Chat**: Chat sessions/threads
- **Message**: Individual messages with AI responses
- **Payment**: Payment transaction records

## Current Development Status

Based on git status:

- Modified: `auth.config.ts`, `login/page.tsx`, `models.ts`, `queries.ts`
- New features: Forgot/reset password flows (in progress)
- Recent commits: Pro plan integration, phone number field, webhook event updates

## Important Notes

- Uses Next.js App Router (not Pages Router)
- React 19 RC - may have unstable APIs
- NextAuth v5 beta - breaking changes from v4
- pnpm is the required package manager
- Turbo mode enabled for faster dev builds
- Model display naming: "Lucinova" (custom) vs "Gemini" (original)

## License

MIT
