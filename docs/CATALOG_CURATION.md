# Catalog Curation

UseStack public discovery is intentionally smaller than the raw product table.
The database may keep long-tail records for stack context, admin review, and future
reconsideration, but the public directory should stay focused.

## Current Public Policy

The July 2026 strict audit keeps products public only when they are:

- AI-native, not just an incumbent SaaS product with AI features
- current and useful to builders assembling an AI stack
- high-signal in at least one core workflow: build, create, research, automate,
  sell, support, or operate
- distinct from an existing listing

Products are hidden from public discovery when they are:

- generic SaaS, infrastructure, or productivity tools with light AI positioning
- broad incumbents that are better used as stack context
- duplicate listings or stale variants
- niche/low-confidence products that do not improve browsing quality

Products are marked remove only when they are directories, duplicates, invalid,
inactive, or not products users can reasonably add to a stack.

## July 2026 Strict Audit

- Raw records reviewed: 432
- Public directory keep: 130
- Hidden from directory: 287
- Remove candidates: 15

Run the strict re-audit with:

```bash
npm run catalog:reaudit:strict
```

This regenerates `lib/catalog-visibility.generated.mjs` from the strict audit
rules. The underlying Supabase rows are not deleted by this process.
