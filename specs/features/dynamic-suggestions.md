# [IMPLEMENTED] Dynamic User-Relevant Suggestions

**Status:** IMPLEMENTED
**Author:** Lucidity Team
**Created:** 2026-02-23
**Last Updated:** 2026-02-23

## Overview

A personalized suggestion system that analyzes a user's chat history to surface relevant, categorized prompt starters on the empty chat screen. Replaces generic templates with concrete, actionable examples.

## Goals

- Surface contextually relevant suggestions based on user's past chat categories
- Provide concrete, immediately useful prompts (not generic placeholders)
- Support 6 categories: Coding, Academic, Creative, Business, Data, General

## Non-Goals

- AI-generated suggestions (static library for now)
- Collaborative or team-level suggestions
- Real-time trending suggestions

## Requirements

### Functional Requirements

**Must Have:**

- [x] Curated suggestion library with concrete examples per category
- [x] Server action to fetch personalized suggestions (`fetchUserSuggestions`)
- [x] Automatic chat categorization on first AI response
- [x] Category-weighted ranking algorithm

**Should Have:**

- [ ] A/B testing of suggestion effectiveness
- [ ] User ability to dismiss or pin suggestions

### Non-Functional Requirements

- **Performance:** Suggestions load in <200ms (server action with DB query)
- **Scalability:** Works with any number of user chats

## Technical Design

### Architecture

```
[Empty Chat Screen] → fetchUserSuggestions() server action
                          ↓
                    getCategoryCounts(userId)  →  MongoDB aggregation
                          ↓
                    rankSuggestions(counts, SUGGESTION_LIBRARY)
                          ↓
                    Return top 4 weighted suggestions
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

### Component Specifications

**ChatList** (`components/custom/chat-list.tsx`)

- Fetches suggestions via `fetchUserSuggestions()` on mount
- Renders a 2-column responsive grid of suggestion cards
- Each card sets the input field on click

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
