# Delibration

Slack-style AI chat application with threaded conversations powered by Google Gemini.

## Key Features

- **Threaded Conversations**: Organize discussions with nested replies - keep context intact
- **Real-time Streaming**: Fast responses via Vercel AI SDK streaming
- **Persistent History**: MongoDB-backed chat storage with automatic session management
- **Secure Auth**: NextAuth.js with email/password authentication
- **Modern UI**: Responsive Slack-like interface built with shadcn/ui and Tailwind CSS

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd delibration
pnpm install

# Configure environment
cp .env.example .env.local
# Add your credentials:
# - MONGODB_URI
# - AUTH_SECRET
# - GOOGLE_GENERATIVE_AI_API_KEY

# Run development server
pnpm dev
```

Open http://localhost:3000

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
```

## License

MIT
