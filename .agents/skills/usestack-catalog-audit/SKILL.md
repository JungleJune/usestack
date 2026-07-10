---
name: usestack-catalog-audit
description: Audit UseStack AI tool listings for public visibility, categorization, freshness, duplicate records, launch recency, and AI-native fit.
---

# UseStack Catalog Audit

Use this skill when auditing UseStack products, reviewing search/filter quality,
checking whether listings should stay public, or scouting new AI-native tools to
add to the directory.

## Product Standard

UseStack is a curated directory of AI-native products and builder stacks. Keep
the public catalog compact. The raw database can keep long-tail products for
admin review and stack context, but the public directory should show products
that help builders discover useful AI tools quickly.

Public listings should be:

- AI-native, not just an incumbent product with a light AI feature
- active, reachable, and useful as of the audit date
- founded in 2023 or later when scouting new companies
- useful to builders in at least one workflow: build, create, research,
  automate, sell, support, or operate
- distinct from existing products in the catalog
- accurately categorized and tagged for search

Hide from public discovery when a product is:

- an incumbent SaaS product where AI is not the core product
- older than 2022 unless it is a current AI-native anchor product
- useful only as stack context, not primary discovery
- too niche, unclear, or low-confidence for the public directory
- missing enough information to categorize reliably

Mark as remove only when a product is:

- shut down, unreachable, or no longer a real product
- a duplicate, directory, article, job board, course, or agency listing
- spammy, unsafe, or impossible for users to evaluate
- not relevant to AI tools or AI workflows

When uncertain, mark `needs_review` instead of inventing facts.

## Audit Inputs

Prefer structured repository data when available:

- `outputs/catalog-audit-*/strict-audit.json`
- `lib/catalog-visibility.generated.mjs`
- `docs/CATALOG_CURATION.md`
- Supabase product rows when the environment is configured
- public sources supplied by the user

For new-company scouting, review these sources first when current network access
is available:

- `https://a16z.com/ai/`
- `https://www.ycombinator.com/companies/industry/ai`
- `https://sequoiacap.com/our-companies/?_categories=ai#all-panel`

Only recommend companies founded after 2023 unless the user explicitly asks for
older products.

## Output Format

Return a compact audit report with:

- `Keep`: high-confidence public listings
- `Hide`: real products better kept out of public discovery
- `Remove`: dead, duplicate, invalid, or non-product records
- `Needs confirmation`: records requiring user judgment or live verification
- `Category updates`: current category, proposed category, and reason
- `New additions`: company, source, founded year, URL, category, and reason

For database-impacting recommendations, include the proposed action rather than
directly deleting data:

- `directory_and_stacks`
- `stacks_only`
- `remove_candidate`
- `needs_review`

## Verification

Before finishing an audit:

1. Confirm the recommendation follows `docs/CATALOG_CURATION.md`.
2. Check for duplicate names, similar products, and renamed companies.
3. Verify live URLs when network access is available.
4. Keep factual claims source-backed when they affect keep/remove decisions.
5. If changing generated visibility files, run:

```bash
npm run catalog:reaudit:strict
npm run check
```

Do not delete Supabase records directly unless the user explicitly asks for a
database mutation and the target rows are unambiguous.
