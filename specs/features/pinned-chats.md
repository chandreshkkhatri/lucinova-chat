# [IMPLEMENTED] Pinned Chats

**Status:** IMPLEMENTED
**Author:** Lucidity Team
**Created:** 2026-02-25
**Last Updated:** 2026-02-25

## Overview

A feature allowing users to pin active or important conversations to the top of their chat history sidebar for easy access, regardless of when the chat was last modified.

## Goals

- Allow users to pin and unpin chats seamlessly from the history sidebar.
- Persist pinned state via MongoDB.
- Optimistically update the UI to avoid layout shifting or waiting for server response.
- Sort pinned chats above unpinned chats, ordered by modification date within each group.

## Requirements

### Functional Requirements

**Must Have:**

- [x] Hover or dropdown action to Pin/Unpin a chat in the sidebar.
- [x] Persistent database flag (`isPinned`) on the `Chat` schema.
- [x] API endpoint `PATCH /api/chat/:id/pin` to handle toggling the state.
- [x] Modifying the `getUserChats` query to sort `isPinned: -1` before `updatedAt: -1`.
- [x] Optimistic UI updates using SWR's `mutate` feature.

### Non-Functional Requirements

- **Performance:** Instant feedback on UI when toggling pin status.
- **Scalability:** The `isPinned` parameter is indexed in MongoDB alongside `updatedAt` for fast sorting.

## Technical Design

### Database Changes

- Add `isPinned?: boolean` to the `IMessage` / `Chat` schema in `db/models.ts`.
- Default `isPinned` to `false`.

### API Contracts

```typescript
PATCH /api/chat/:id/pin
Request: {
  isPinned: boolean
}
Response: {
  success: true,
  isPinned: boolean
}
```

### Component Specifications

**SidebarHistory** (`components/custom/sidebar-history.tsx` & `mobile-sidebar-content.tsx`)

- Maps over user chats. If a chat is pinned, displays a solid PushPin icon.
- A DropdownMenu action "Pin" or "Unpin" is available.
- On action click, calls API and updates the local SWR cache via `mutate`.

## Testing Strategy

### Manual Verification

- Pin a chat -> it jumps to the top list instantly.
- Reload page -> chat remains pinned and at top.
- Make a new chat, send a message -> unpinned chats update and move to top of unpinned list, pinned chats stay at very top.
- Unpin chat -> returns to its chronological order below pinned chats.

## Changelog

| Date       | Author        | Changes                         |
| ---------- | ------------- | ------------------------------- |
| 2026-02-25 | Lucidity Team | Initial drafted and implemented |
