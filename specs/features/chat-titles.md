# [IMPLEMENTED] Chat Title Generation

**Status:** IMPLEMENTED
**Author:** Lucidity Team
**Created:** 2026-02-25
**Last Updated:** 2026-02-25

## Overview

Intelligent abstraction of chat messages into a concise summary title. Titles help users navigate their sidebar history. We support both automatic generation (on first message) and manual generation (via user action).

## Goals

- Automatically generate a short, contextual title after the first chat exchange.
- Allow users to manually trigger title generation if a chat somehow lacks one.
- Keep the generation process extremely fast using lightweight models (Gemini Flash).
- Prevent prompt overflow to the model by bounding context length.

## Requirements

### Functional Requirements

**Must Have:**

- [x] Unified helper `generateAndSaveTitle` to analyze chat and hit MongoDB.
- [x] Automatic triggering after first message (text or image based).
- [x] "Generate Title" manual dropdown action in the sidebar for untitled chats.
- [x] Usage of a dedicated `TITLE_MODEL_ID` (`gemini-2.5-flash-lite`) to ensure hyper-fast labeling.
- [x] Truncation of prompt input (e.g. max 800 chars) to ensure the title generator isn't bogged down by giant text dumps.

### Non-Functional Requirements

- **Performance:** Title generation must resolve within 1-2 seconds.
- **Resilience:** If title generation errors, it fails gracefully without breaking the chat stream.

## Technical Design

### Algorithm

1. The user sends a prompt.
2. The AI streams the response.
3. Asynchronously, `generateAndSaveTitle` executes.
4. The system truncates the user's prompt taking the first 800 chars.
5. `gemini-2.5-flash-lite` analyzes the short text and returns 2-5 words.
6. The exact title string is committed to MongoDB `Chat` document.

### Component Specifications

**SidebarHistory Actions** (`components/custom/sidebar-history.tsx`):

- Conditionally renders a "Generate Title" option inside the dropdown menu if `chat.title` is derived from standard presets ("New Chat", "Untitled Chat", etc).
- Hits the `POST /api/chat/title` endpoint.
- Refreshes the SWR cache.

## Testing Strategy

### Manual Verification

- Start a new conversation, after AI responds, refresh the page and verify sidebar title.
- Try sending a large string (10k chars), ensure title sets rapidly.
- Start an image-only chat (e.g., Lucinova Image Pro), ensure title sets correctly.
- Click "Generate title" on an old legacy chat, ensure the title applies.

## Changelog

| Date       | Author        | Changes                 |
| ---------- | ------------- | ----------------------- |
| 2026-02-25 | Lucidity Team | Drafted and Implemented |
