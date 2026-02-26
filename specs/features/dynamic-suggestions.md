# [IMPLEMENTED] Dynamic User-Relevant Suggestions

**Status:** IMPLEMENTED
**Author:** Lucidity Team
**Created:** 2026-02-23
**Last Updated:** 2026-02-23

## Overview

A personalized suggestion system that analyzes a user's chat history to surface relevant, categorized prompt starters on the empty chat screen. Replaces generic templates with concrete, actionable examples.

## Goals

- Surface contextually relevant suggestions based on user's past chat categories on empty screens
- Provide concrete, immediately useful prompts (not generic placeholders)
- Support 6 global categories: Coding, Academic, Creative, Business, Data, General
- Dynamically generate 3 highly contextual thread suggestions when user highlights text, using a fast AI model.

## Non-Goals

- AI-generated suggestions (static library for now)
- Collaborative or team-level suggestions
- Real-time trending suggestions

## Requirements

### Functional Requirements

**Must Have:**

- [x] Curated global suggestion library with concrete examples per category
- [x] Server action to fetch personalized global suggestions (`fetchUserSuggestions`)
- [x] Server action to generate dynamic textual context suggestions (`fetchContextualSuggestions`)
- [x] Automatic chat categorization on first AI response
- [x] Category-weighted ranking algorithm
- [x] Integration of `gemini-2.5-flash-lite` for near zero-latency contextual thread suggestions.

**Should Have:**

- [ ] A/B testing of suggestion effectiveness
- [ ] User ability to dismiss or pin suggestions

### Non-Functional Requirements

- **Performance:** Suggestions load in <200ms (server action with DB query)
- **Scalability:** Works with any number of user chats

## Technical Design

### Architecture

**Global Empty Chat Suggestions:**

```
[Empty Chat Screen] → fetchUserSuggestions() server action
                          ↓
                    getCategoryCounts(userId)  →  MongoDB aggregation
                          ↓
                    rankSuggestions(counts, SUGGESTION_LIBRARY)
                          ↓
                    Return top 4 weighted suggestions
```

**Contextual Thread Suggestions:**

```
[User Highlights Text] → Opens Right Sidebar (Thread View)
                          ↓
                    fetchContextualSuggestions(highlightedText)
                          ↓
                    gemini-2.5-flash-lite inference
                          ↓
                    Return top 3 contextual action/question suggestions
```

### Data Models

```typescript
interface Suggestion {
  label: string; // Display text
  value: string; // Full prompt to submit
  iconName: string; // "code" | "message" | "diagram" | "sparkles"
  color: string; // "blue" | "green" | "orange" | "purple" | etc.
  category: string; // Matching chat category
}
```

**ChatList** (`components/custom/chat-list.tsx`)

- Fetches global suggestions via `fetchUserSuggestions()` on mount for empty chats.
- Renders a 2-column responsive grid of suggestion cards.
- If rendering a Thread Context (`isThread` and `selectedText` present), fetches contextual suggestions via `fetchContextualSuggestions(selectedText)`.
- If thread context generation fails, falls back to personalized global suggestions.
- Each card sets the input field on click and focuses the textarea.

## Dependencies

- MongoDB `Chat` model with `category` field
- `app/api/chat/route.ts` for category assignment on first exchange

## Testing Strategy

### Manual Verification

- Verify suggestions change based on user chat history categories
- Confirm 4 suggestions render on empty chat screen
- Test clicking a suggestion populates input field

## References

- `lib/suggestions.ts` — Suggestion library
- `lib/suggestions-service.ts` — Ranking logic
- `app/actions/suggestions.ts` — Server action
- `components/custom/chat-list.tsx` — UI rendering

## Changelog

| Date       | Author        | Changes                |
| ---------- | ------------- | ---------------------- |
| 2026-02-23 | Lucidity Team | Initial implementation |
