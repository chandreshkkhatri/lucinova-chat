# Lucidity Project Roadmap

## 🌟 Vision

To create a high-performance, Slack-style AI companion that makes complex information accessible through intuitive threaded conversations, advanced visualization, and personalized interactions. We aim to exceed the capabilities of flagship apps like Google Gemini by offering a more developer-centric, multimodal, and integrated experience.

## 📊 Current State (v0.1.5)

Lucidity is currently a functional AI chat platform supporting:

- **Threaded Conversations**: Nested discussions for deep context management.
- **Gemini 2.0 Integration**: Powered by Google's latest models for fast, intelligent responses.
- **Dynamic Suggestions**: Personalized query starters based on user history and category analysis.
- **Midnight Vibrant Theme**: A high-clarity, premium dark theme.
- **Mobile-First UX**: Refined selection interactions and responsive layout.
- **Secure Auth**: Support for OAuth and Email/Password.

---

## 🏃 Sprint History

### Sprint 1: UX Refinement & Personalization (Recent)

- **Status**: ✅ Completed (2026-02-23)
- **Focus**: Improving the initial user experience and clarifying mobile interactions.
- **Key Deliverables**:
  - [x] **Theme**: Implemented "Midnight Vibrant" design system with optimized `.bg-paper` backgrounds.
  - [x] **Suggestions**: Built a dynamic suggestion engine using `suggestions-service.ts` and a curated library.
  - [x] **Category Analysis**: Introduced automatic chat categorization (Coding, Creative, etc.) in `app/api/chat/route.ts`.
  - [x] **Mobile UX**: Disabled native context menu overlap and refined selection positioning in `EnhancedMessage.tsx`.
  - [x] **Bug Fixes**: Resolved 401 Unauthorized errors for guest users in thread counts.
  - [x] **Streaming Perf**: Stream closes immediately; DB writes run asynchronously (no delay).
  - [x] **Single Avatar**: Removed duplicate avatar during message streaming.
  - [x] **Copy in Threads**: Added copy button for thread header highlighted text.
  - [x] **Edit/Regenerate**: Users can edit their last message or regenerate the last AI response.
  - [x] **Pinned Chats**: Pin/unpin chats to keep them at the top of the history list.
  - [x] **Chat Titles**: Automatic and manual title generation powered by `gemini-2.5-flash-lite`.
  - [x] **UI Polish**: Annotation hover text, smooth sidebar animations, contextual thread suggestions (via `gemini-2.5-flash-lite`), and font readability settings.

---

## 🎯 Future Sprints (The Competitive Edge)

### Sprint 2: Parity & Multimodality

- **Status**: 📅 Planned
- **Focus**: Matching Gemini's core multimedia and research strengths.
- **Target Features**:
  - [ ] **Google Search Grounding**: Connect threads to real-time web data for verified, up-to-date answers.
  - [ ] **Advanced Vision**: Ingest PDFs, charts, and diagrams with spatial reasoning.
  - [ ] **Image Generation**: Native DALL-E 3 / Replicate integration for high-quality visuals.
  - [ ] **Voice (Lucidity Live)**: Low-latency, interruptible voice conversations for mobile.
  - [ ] **File Workspace**: Dedicated "Files" tab per chat for processing large documents.

### Sprint 3: The Lucidity Differentiators (Better than Gemini)

- **Status**: 📅 Planned
- **Focus**: Unique features that go beyond a simple chat bubble.
- **Target Features**:
  - [ ] **Interactive Canvas Sandbox**: A side-by-side whiteboard where the AI can render code previews, block diagrams, or live UI mockups.
  - [ ] **Multi-Model Intelligence**: Switch between Gemini for speed, GPT-4 for logic, or Claude for writing within the same thread.
  - [ ] **Deep RAG (Universal Context)**: A vector memory system that searches all your past threads to provide "Long-Term Memory" awareness.
  - [ ] **Developer Mode**: Native Git integration—ask the AI to create a branch, commit code, or draft a Pull Request directly from chat.

### Sprint 4: Collaboration & Ecosystem

- **Status**: 📅 Planned
- **Focus**: Scaling to teams and external integrations.
- **Target Features**:
  - [ ] **Shared Threads & Public Links**: Instant sharing of a conversation branch.
  - [ ] **Workspaces & Teams**: Collaborative chat environments with shared "Memory Banks".
  - [ ] **Lucidity Extensions**: Build connections to Slack, GitHub, and Jira.
  - [ ] **Privacy-First Vault**: Encrypted threads and the option for local-only RAG processing.

---

## 🛠 Active Work

Currently tracking issues and sprints via [ROADMAP.md](file:///home/ubuntu/code/lucidity.chat/ROADMAP.md) and [task.md](file:///home/ubuntu/.gemini/antigravity/brain/c0e4ba46-aaec-4715-9b39-ac47fbb9df84/task.md).
