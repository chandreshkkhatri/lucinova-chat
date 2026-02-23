# [IMPLEMENTED] Mobile Selection UX & Context Menu

**Status:** IMPLEMENTED
**Author:** Lucidity Team
**Created:** 2026-02-23
**Last Updated:** 2026-02-23

## Overview

Refined mobile text selection interactions to ensure the "Ask Lucinova" button is consistently accessible. Prevents the native OS context menu from overlapping custom UI elements within message containers.

## Goals

- Ensure "Ask Lucinova" button is always visible above selected text on all devices
- Prevent native OS context menu from obstructing custom selection UI on mobile
- Maintain desktop selection behavior unchanged

## Non-Goals

- Custom context menu with multiple actions (future enhancement)
- Haptic feedback or gesture-based interactions

## Requirements

### Functional Requirements

**Must Have:**

- [x] "Ask Lucinova" button appears above selected text on all devices
- [x] Native context menu suppressed within message containers on mobile
- [x] Selection highlight overlays render correctly on both mobile and desktop

**Should Have:**

- [ ] Custom context menu with copy, highlight, and thread options

### Non-Functional Requirements

- **Accessibility:** Selection still works normally; only default menu is suppressed
- **Performance:** No additional re-renders from selection handling

## Technical Design

### Architecture

```
[EnhancedMessage Container]
    ├── onContextMenu → e.preventDefault() (mobile only)
    ├── selectionchange listener → compute rects
    └── Overlay: highlight rects + "Ask Lucinova" button (above first rect)
```

### Component Specifications

**EnhancedMessage** (`components/custom/enhanced-message.tsx`)

- Detects mobile via `window.innerWidth < 768`
- Suppresses `contextmenu` event on mobile within message content
- Computes selection bounding rects relative to container
- Renders button at `transform: translate(-50%, -100%)` above first rect

## Testing Strategy

### Manual Verification

- On mobile: select text in a message, verify "Ask Lucinova" appears above selection
- On mobile: verify native context menu is suppressed within message containers
- On desktop: verify selection behavior and context menu are unaffected

## References

- `components/custom/enhanced-message.tsx` — Selection handling
- `hooks/use-mobile.tsx` — Mobile detection hook

## Changelog

| Date       | Author        | Changes                |
| ---------- | ------------- | ---------------------- |
| 2026-02-23 | Lucidity Team | Initial implementation |
