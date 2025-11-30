# [DRAFT] Feature/Component Name

**Status:** DRAFT | REVIEW | APPROVED | IMPLEMENTED | DEPRECATED  
**Author:** Your Name  
**Created:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD  
**Originally Built:** *(Optional: for documenting existing features)*

## Overview

Brief description of what this specification covers. Explain the problem being solved or the feature being added.

## Goals

What this specification aims to achieve:
- Goal 1
- Goal 2
- Goal 3

## Non-Goals

What this specification explicitly does NOT cover:
- Non-goal 1
- Non-goal 2

## Background & Context

Provide relevant context:
- Why is this needed?
- What is the current state?
- What user problems does this solve?
- Links to related discussions or issues

> **Note:** For new features, describe the problem and proposed solution. For documenting existing features (starting at IMPLEMENTED), describe what was built and why.

## Requirements

### Functional Requirements

**Must Have:**
- [ ] Requirement 1
- [ ] Requirement 2

**Should Have:**
- [ ] Requirement 3
- [ ] Requirement 4

**Nice to Have:**
- [ ] Requirement 5

### Non-Functional Requirements

- **Performance:** Expected performance characteristics
- **Security:** Security considerations and requirements
- **Accessibility:** A11y requirements
- **Scalability:** How it should scale
- **Maintainability:** Code quality and documentation needs

## Technical Design

### Architecture

Describe the high-level architecture and how components interact.

```
[Diagrams, flowcharts, or ASCII art here]
```

### Data Models

```typescript
// Define TypeScript interfaces or database schemas
interface Example {
  id: string;
  name: string;
  createdAt: Date;
}
```

### API Contracts

```typescript
// For API endpoints
POST /api/example
Request: {
  "field": "value"
}

Response: {
  "id": "123",
  "status": "success"
}
```

### Component Specifications

For UI components, specify:
- Props interface
- State management
- Event handlers
- Styling approach

### Database Changes

- Schema modifications
- Migrations needed
- Indexes to create
- Data transformations

## User Experience

### User Flows

Describe the user journey through the feature.

### UI/UX Mockups

Link to or embed mockups, wireframes, or design files.

## Dependencies

- Related specifications
- External libraries or services
- Infrastructure requirements
- Team dependencies

## Security Considerations

- Authentication requirements
- Authorization rules
- Data privacy concerns
- Input validation
- Rate limiting

## Testing Strategy

### Unit Tests

What should be unit tested and how.

### Integration Tests

How components work together.

### E2E Tests

End-to-end user flows to test.

### Performance Tests

Load testing, benchmarking requirements.

## Rollout Plan

- Feature flags
- Phased rollout strategy
- Monitoring and metrics
- Rollback plan

> **When IMPLEMENTED:** Update this section to reflect actual deployment status (e.g., "✅ Deployed on YYYY-MM-DD").

## Success Metrics

How to measure if this feature is successful:
- Metric 1
- Metric 2
- Metric 3

## Open Questions

- [ ] Question 1?
- [ ] Question 2?

## Alternatives Considered

What other approaches were considered and why they were rejected.

## References

- Links to related docs
- External references
- Similar implementations

## Changelog

| Date | Author | Changes |
|------|--------|--------|
| YYYY-MM-DD | Name | Initial draft |

> **Status Lifecycle:** DRAFT → REVIEW → APPROVED → IMPLEMENTED → DEPRECATED  
> When a feature is implemented, update the spec to reflect what was actually built. The IMPLEMENTED spec serves as the living documentation.
