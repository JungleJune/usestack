# Product Requirements

## Product Goal

Help builders discover credible AI-native products and understand how those products fit into real workflows. UseStack should favor useful curation over directory size.

## Primary Users

- Builders evaluating tools for a specific job
- Operators looking for repeatable productivity workflows
- AI product teams publishing meaningful launches and updates
- Editors curating products, stacks, articles, and sponsorships

## Functional Requirements

### Discovery

- Search products by name, description, category, tag, and use case.
- Filter without losing URL state.
- Show a useful logo or thumbnail on every product card.
- Exclude hidden, closed, duplicate, non-AI-native, or unverifiable products.
- Provide a clear product detail page and an external product link.

### Stacks and Workflows

- Publish builder stacks with a purpose for each tool.
- Generate a workflow from a bounded user query.
- Only reference products that exist in the catalog.
- Preserve generated workflows so they can be shared.

### Editorial

- Publish product updates, launches, and practical articles.
- Sanitize rich HTML before rendering.
- Support draft or pending review before publication.

### Administration

- Require an authenticated `admin` or `agent` role.
- Route privileged database and storage operations through the server.
- Maintain products, categories, tags, submissions, stacks, blogs, and sponsorships.
- Preserve an audit-friendly review status for user submissions.

## Non-Functional Requirements

- Accessibility: keyboard navigation, visible focus states, semantic controls, and meaningful image alternatives.
- Performance: responsive first content, lazy-loaded card media, and cached third-party feeds.
- Reliability: production builds must pass lint, type, unit, secret, and dependency checks.
- Security: no committed credentials, no browser service-role key, SSRF protection, bounded input, and least-privilege database policies.
- Maintainability: shared product normalization, server-only privileged clients, and documented ownership boundaries.

## Success Measures

- Search-to-product click-through rate
- Percentage of catalog products verified in the last 90 days
- Stack saves, shares, and outbound product visits
- Monthly returning users
- Submission acceptance rate and review time
- Zero critical/high dependency advisories at release time

## Definition of Done

A change is complete when its acceptance criteria are met, security impact is reviewed, automated tests cover changed logic, `npm run ci` passes, documentation is updated, and a Preview deployment has been checked.
