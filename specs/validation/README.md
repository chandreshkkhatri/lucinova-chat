# Spec Validation Script

This script validates specification files to ensure they follow the required format and contain necessary sections.

## Usage

```bash
pnpm run validate-specs
```

Or validate a specific spec:

```bash
pnpm run validate-specs specs/features/my-feature.md
```

## Checks Performed

- ✅ Status label is present ([DRAFT], [REVIEW], [APPROVED], [IMPLEMENTED], [DEPRECATED])
- ✅ Required sections exist (Overview, Goals, Requirements, Technical Design, Testing Strategy)
- ✅ Proper markdown formatting
- ✅ Checklist items for requirements
- ✅ Author and date metadata present
