# Specification-Driven Development Workflow

## Overview

This project follows a **specification-first** approach to development. Before writing code, we write detailed specifications that describe what we're building and why.

## Why Spec-Driven Development?

✅ **Clear Requirements** - Everyone understands what's being built  
✅ **Better Design** - Think through architecture before coding  
✅ **Easier Reviews** - Review specs before expensive implementation  
✅ **Living Documentation** - Specs stay in sync with code  
✅ **Onboarding** - New team members understand features quickly  
✅ **Reduced Rework** - Catch issues early in the design phase  

## The Workflow

### 1. **Create a Specification**

When starting a new feature or major change:

```bash
pnpm spec:new
```

This interactive tool will:
- Ask for the spec type (feature, API, component, database)
- Generate a new spec file from the template
- Pre-fill metadata (author, dates)

Or copy `specs/TEMPLATE.md` manually and customize it.

### 2. **Write the Spec - [DRAFT] Status**

Fill in all sections of the spec:
- **Overview**: What problem does this solve?
- **Goals & Non-Goals**: What's in and out of scope?
- **Requirements**: What must/should/could be done?
- **Technical Design**: Architecture, data models, APIs
- **Testing Strategy**: How to validate it works
- **Dependencies**: What else is needed?

Keep the status as `[DRAFT]` while writing.

### 3. **Validate Your Spec**

Before requesting review, validate the spec:

```bash
pnpm validate-specs specs/features/your-spec.md
```

This checks for:
- Valid status label
- Required sections present
- Proper metadata (author, dates)
- Requirement checkboxes

Fix any validation errors.

### 4. **Request Review - [REVIEW] Status**

When ready for feedback:
1. Change status to `[REVIEW]`
2. Commit the spec to git
3. Create a pull request or request review
4. Address feedback and update the spec

### 5. **Get Approval - [APPROVED] Status**

Once the spec is approved:
1. Change status to `[APPROVED]`
2. Merge the spec PR
3. Now you can start implementation

### 6. **Implement the Feature**

With an approved spec:
- Reference the spec during implementation
- Keep code aligned with the spec
- If you discover issues, update the spec
- Add tests as defined in the Testing Strategy

### 7. **Mark as Implemented - [IMPLEMENTED] Status**

After the feature is complete and deployed:
1. Change status to `[IMPLEMENTED]`
2. Update the **Last Updated** date
3. Add implementation notes if needed
4. Link to relevant PRs or commits

### 8. **Maintain Specs**

Specs are living documents:
- Update them when requirements change
- Mark deprecated features as `[DEPRECATED]`
- Keep specs in sync with code
- Reference specs in code reviews

## Spec Status Lifecycle

```
[DRAFT] ──> [REVIEW] ──> [APPROVED] ──> [IMPLEMENTED]
                                              │
                                              └──> [DEPRECATED]
```

## Best Practices

### ✅ Do:
- Write specs before code
- Be specific about requirements
- Include diagrams and examples
- Link to related specs
- Update specs when plans change
- Get feedback early and often
- Use checklists for requirements
- Consider security and performance

### ❌ Don't:
- Skip the spec process for "quick fixes"
- Write vague requirements
- Ignore validation errors
- Let specs become outdated
- Implement before approval (except prototypes)
- Copy-paste specs without customization

## Spec Types

### Feature Specs (`specs/features/`)
High-level features from a user perspective:
- User stories
- User flows
- UI/UX requirements
- Cross-cutting concerns

Example: `chat-threading.md`

### API Specs (`specs/api/`)
Backend endpoints and services:
- Request/response formats
- Authentication requirements
- Error handling
- Rate limits

Example: `payment-webhook-api.md`

### Component Specs (`specs/components/`)
Reusable UI components:
- Props interface
- State management
- Event handlers
- Styling guidelines

Example: `message-component-spec.md`

### Database Specs (`specs/database/`)
Data models and schemas:
- Schema definitions
- Relationships
- Indexes
- Migrations

Example: `user-subscription-schema.md`

## Tips for Writing Good Specs

### Clear Goals
State exactly what you're trying to achieve and why it matters.

### Explicit Non-Goals
Define what you're NOT doing to avoid scope creep.

### Concrete Examples
Show example API calls, UI mockups, or data structures.

### Consider Edge Cases
Think through error states, empty states, loading states.

### Define Success
How will you know this feature is successful? What metrics matter?

### Keep It Updated
Treat specs as living documents. Update when plans change.

## Integration with Development

### Code Reviews
- Reference the spec in PRs
- Verify implementation matches spec
- Update spec if changes needed

### Testing
- Write tests based on Testing Strategy section
- Cover requirements from the spec
- Validate success metrics

### Documentation
- Link to specs from code comments
- Reference specs in API docs
- Use specs for onboarding

## Questions?

- See example spec: `specs/features/chat-threading.md`
- Check the template: `specs/TEMPLATE.md`
- Review workflow guide: `specs/README.md`

## Commands Reference

```bash
# Create new spec interactively
pnpm spec:new

# Validate all specs
pnpm validate-specs

# Validate specific spec
pnpm validate-specs specs/features/my-feature.md
```
