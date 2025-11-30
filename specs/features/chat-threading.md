# [IMPLEMENTED] Chat Message Threading

**Status:** IMPLEMENTED  
**Author:** Lucidity Team  
**Created:** 2025-11-15  
**Last Updated:** 2025-11-30  
**Originally Built:** 2025-11-15

## Overview

Enable users to create threaded conversations from any message or selected text in a chat. This allows for focused discussions on specific topics without cluttering the main chat flow.

## Goals

- Allow users to start a thread from any message
- Support text selection to create context-specific threads
- Display thread count badges on messages with active threads
- Provide seamless navigation between main chat and threads
- Maintain conversation context when creating threads

## Non-Goals

- Nested threads (threads within threads)
- Thread merging or splitting
- Real-time thread notifications (future enhancement)
- Thread permissions or privacy controls

## Background & Context

Users need a way to have side discussions about specific topics without derailing the main conversation. The current implementation allows:
- Clicking "Ask Tara" on any message
- Selecting text and using the context menu
- Viewing threads in a modal overlay

This spec documents the existing implementation and defines the expected behavior for future enhancements.

## Requirements

### Functional Requirements

**Must Have:**
- [x] Create thread from any message via "Ask Tara" button
- [x] Create thread from selected text via context menu
- [x] Display thread count badge on messages with threads
- [x] Modal view for thread conversations
- [x] Include parent message context in thread
- [x] Include 4 previous messages for context
- [x] Persist threads to database
- [x] Associate threads with parent messages

**Should Have:**
- [ ] Keyboard shortcuts for thread operations
- [ ] Thread preview on hover
- [ ] Sort/filter threads by activity
- [ ] Thread title/summary generation

**Nice to Have:**
- [ ] Collapsible thread view in main chat
- [ ] Thread search functionality
- [ ] Thread archiving

### Non-Functional Requirements

- **Performance:** Thread loading < 500ms
- **Security:** Threads inherit chat permissions
- **Accessibility:** Keyboard navigation and screen reader support
- **Scalability:** Support 100+ threads per chat
- **Maintainability:** Clear separation between thread and main chat logic

## Technical Design

### Architecture

```
[Main Chat] ──> [EnhancedMessage] ──> onAskTara event
                      │
                      ├──> [SelectionContextMenu]
                      │         │
                      │         └──> onStartThread
                      │
                      └──> [ThreadView Modal]
                                  │
                                  └──> /api/thread endpoint
```

### Data Models

```typescript
interface DbMessage {
  id: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant';
  parentMsgId?: string;  // Reference to parent message for threads
  createdAt: Date;
}

interface ThreadContext {
  parentMessage: DbMessage;
  previousMessages: DbMessage[];  // Last 4 main chat messages
  selectedText?: string;
}
```

### API Contracts

```typescript
POST /api/thread
Request: {
  chatId: string;
  messages: Message[];
  parentMsgId: string;
  selectedText?: string;
}

Response: Stream (text/event-stream)
- Text chunks from AI model
- Persists both user and assistant messages with parentMsgId
```

```typescript
GET /api/threads
Request: ?chatId={chatId}&parentMsgId={parentMsgId}

Response: {
  threads: DbMessage[];
}
```

### Component Specifications

**EnhancedMessage** (`components/custom/enhanced-message.tsx`)
- Props: `message`, `onAskTara`, `isThreadMessage`
- Emits `onAskTara(messageId, selectedText?)` on button click or text selection
- Shows thread count badge from `useThreadCount` hook

**ThreadView** (`components/custom/thread-view.tsx`)
- Props: `chatId`, `parentMsgId`, `selectedText?`, `onClose`
- Fetches thread messages via `/api/threads`
- Uses separate Chat instance with `api="/api/thread"`
- Modal overlay with close functionality

**SelectionContextMenu** (`components/custom/selection-context-menu.tsx`)
- Shows "Ask Tara" option on text selection
- Emits `onStartThread(selectedText)` callback

### Database Changes

- Messages table includes optional `parentMsgId` field
- Compound index on `(chatId, parentMsgId)` for thread queries
- Existing schema supports threads; no migration needed

## User Experience

### User Flows

**Starting a Thread:**
1. User hovers over a message
2. Clicks "Ask Tara" button OR selects text and uses context menu
3. Thread modal opens with parent message context
4. User types question/comment
5. AI responds in thread context
6. Thread is persisted with parentMsgId reference

**Viewing Threads:**
1. User sees thread count badge on message
2. Clicks "Ask Tara" to view existing threads
3. Modal shows all thread messages
4. User can continue conversation

### UI/UX Mockups

- Thread badge: Small number indicator on messages with threads
- Modal: Full-screen overlay with thread conversation
- Context display: Parent message shown at top of thread

## Dependencies

- Vercel AI SDK for streaming
- MongoDB for thread persistence
- SWR for thread count caching
- NextAuth for user context

## Security Considerations

- Thread access controlled by chat ownership
- User authentication required via NextAuth
- Thread messages inherit chat permissions
- No public thread sharing (private to chat participants)

## Testing Strategy

### Unit Tests

- Thread creation with/without selected text
- Thread count calculation
- Context building (parent + previous messages)

### Integration Tests

- Full thread creation flow
- API endpoint responses
- Database persistence

### E2E Tests

- User creates thread from message
- User creates thread from selection
- Thread modal displays correctly
- Thread messages persist and reload

## Rollout Plan

- ✅ Already implemented and deployed
- Monitoring thread creation rates
- Tracking modal interaction metrics
- No feature flag needed (stable)

## Success Metrics

- Thread creation rate (% of chats with threads)
- Thread engagement (messages per thread)
- Thread modal abandonment rate
- User feedback on thread UX

## Open Questions

- [x] How many previous messages for context? *(4 messages)*
- [x] Should threads be collapsible in main view? *(Modal only for now)*
- [ ] Auto-generate thread titles?
- [ ] Allow thread to thread transitions?

## Alternatives Considered

**Inline Threading:**
- Threads appear as collapsed sections in main chat
- Rejected: Too cluttered, harder to focus

**Separate Thread Page:**
- Navigate to new route for threads
- Rejected: Breaks flow, too much context switching

**Current Modal Approach:**
- Best balance of focus and accessibility
- Keeps main chat clean
- Easy to dismiss

## References

- `/app/(chat)/api/thread/route.ts` - Thread API implementation
- `/components/custom/thread-view.tsx` - Thread UI component
- `/components/custom/enhanced-message.tsx` - Message with thread support
- `/db/queries.ts` - Thread database queries

## Changelog

| Date | Author | Changes |
|------|--------|--------|
| 2025-11-15 | Lucidity Team | Initial implementation |
| 2025-11-30 | Lucidity Team | Documented as IMPLEMENTED spec |
