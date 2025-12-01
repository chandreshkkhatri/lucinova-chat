# Lucidity

Slack-style AI chat application with threaded conversations powered by Google Gemini.

## Key Features

- **Threaded Conversations**: Organize discussions with nested replies - keep context intact
- **Real-time Streaming**: Fast responses via Vercel AI SDK streaming
- **Persistent History**: MongoDB-backed chat storage with automatic session management
- **Secure Auth**: NextAuth.js with email/password and Google OAuth authentication
- **Modern UI**: Responsive Slack-like interface built with shadcn/ui and Tailwind CSS

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd lucidity
pnpm install

# Configure environment
# Create a .env file in the root directory
# See ENV_SETUP.md for detailed configuration instructions
# Required credentials:
# - MONGODB_URI
# - AUTH_SECRET
# - GOOGLE_GENERATIVE_AI_API_KEY
# - GOOGLE_CLIENT_ID (for Google OAuth)
# - GOOGLE_CLIENT_SECRET (for Google OAuth)

# Run development server
pnpm dev
```

Open http://localhost:3000

**Note:** For complete environment setup instructions including Google OAuth configuration, see [ENV_SETUP.md](./ENV_SETUP.md)

## Tech Stack

- **Next.js 15** (App Router)
- **Google Gemini** (AI Model)
- **MongoDB** (Database)
- **NextAuth.js** (Authentication)
- **Vercel AI SDK** (Streaming)
- **shadcn/ui** (Components)

## Scripts

```bash
pnpm dev              # Development server
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # Run linter
pnpm migrate-indexes  # Setup MongoDB indexes
pnpm validate-specs   # Validate specification files
pnpm spec:new         # Create a new specification
```

## Project Structure

```
app/
├── (auth)/          # Authentication pages
├── (chat)/          # Chat interface & API routes
│   ├── api/         # Backend endpoints
│   └── chat/        # Chat UI pages
components/
├── custom/          # App-specific components
└── ui/              # Reusable UI components
db/                  # Database models & queries
ai/                  # AI SDK configuration
specs/               # Feature specifications (spec-driven development)
├── features/        # Feature specs
├── api/             # API endpoint specs
├── components/      # Component specs
└── database/        # Database schema specs
```

## Spec-Driven Development

This project follows a specification-driven development workflow. All features should be documented in `specs/` before implementation.

**Creating a new spec:**
```bash
pnpm spec:new
```

**Validating specs:**
```bash
pnpm validate-specs
```

See `specs/README.md` for the complete specification workflow and guidelines.

## License

MIT
