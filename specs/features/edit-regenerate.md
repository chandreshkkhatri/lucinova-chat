# [IMPLEMENTED] Edit Message & Regenerate Response

**Status:** IMPLEMENTED
**Author:** Lucidity Team
**Created:** 2026-02-23
**Last Updated:** 2026-02-23

## Overview

Allows users to edit their last sent message and get a fresh AI response, or regenerate the last AI response without re-typing. Works in both main chat and thread views.

## Goals

- Let users correct mistakes in their last message without starting a new chat
- Allow one-click regeneration of the last AI response
- Maintain consistent UX between main chat and threads

## Non-Goals

- Editing any message in the history (only the last user message)
- Branching conversations (showing both old and new responses)
- Version history of edits

## Requirements

### Functional Requirements

**Must Have:**

- [x] Edit button (pencil icon) on the last user message when idle
- [x] Inline textarea editor with "Save & Resend" and "Cancel" actions
- [x] Keyboard shortcuts: Enter to submit, Escape to cancel
- [x] Regenerate button (refresh icon) on the last assistant message
- [x] `reload()` function in `useGoogleChat` hook
- [x] `editMessage()` function in `useGoogleChat` hook
- [x] Works in both main chat and threads

**Should Have:**

- [ ] Animation on message replacement
- [ ] Undo regeneration

### Non-Functional Requirements

- **Performance:** Edit/regenerate should feel instant (<100ms to UI response)

## Technical Design

### Architecture

```
[ChatList]
  ├── Last User Msg → EditMessageButton (pencil → textarea → Save & Resend)
  │                     └── calls onEditMessage(newContent)
  │                           └── chat.editMessage() → removes old msgs, re-submits
  └── Last AI Msg → Regenerate button
                      └── calls onRegenerate()
                            └── chat.reload() → removes last AI msg, re-sends user msg
```

### Hook API

```typescript
// use-google-chat.ts
reload(): Promise<void>      // Re-send last user message, get fresh response
editMessage(newContent: string): Promise<void>  // Replace & re-send last user message
```

### Component Specifications

**EditMessageButton** (`components/custom/chat-list.tsx`)

- Shows pencil icon button in idle state
- Toggles to inline textarea with pre-filled content
- Submits via Enter, cancels via Escape
- Calls `onEditMessage` prop from `ChatList`

## Testing Strategy

### Manual Verification

- Click Edit on last user message → inline textarea opens → modify → "Save & Resend" → new AI response
- Press Enter to submit edit, Escape to cancel
- Click Regenerate on last AI message → fresh response generated
- Verify both features work in main chat and thread views

## References

- `hooks/use-google-chat.ts` — `reload()` and `editMessage()` implementations
- `components/custom/chat-list.tsx` — `EditMessageButton` component, Regenerate button
- `components/custom/chat.tsx` — Props wiring

## Changelog

| Date       | Author        | Changes                |
| ---------- | ------------- | ---------------------- |
| 2026-02-23 | Lucidity Team | Initial implementation |
