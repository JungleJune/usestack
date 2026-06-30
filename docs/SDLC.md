# Software Development Life Cycle

Every material change moves through the following stages. Small changes may combine meetings or documents, but may not skip the gates.

## 1. Planning and Requirement Analysis

Required:

- Problem statement and target user
- Measurable outcome
- Acceptance criteria and explicit exclusions
- Data, privacy, security, and migration impact
- Dependencies, owner, and rollback risk

Artifacts:

- GitHub issue using the feature or bug template
- Updated requirements when product behavior changes
- Short decision record for cross-cutting architecture

Exit gate: scope and acceptance criteria are clear enough for an independent reviewer to verify.

## 2. Design

Required:

- User flow and all empty, loading, error, and permission states
- Data flow and trust-boundary review
- API and database contract changes
- Accessibility and responsive behavior
- Rollout and rollback approach

Exit gate: design handles expected failure modes and avoids placing privileged credentials or authorization in the browser.

## 3. Development

Rules:

- Create a focused branch and small pull request.
- Follow existing component and server helper patterns.
- Keep privileged access in server-only modules.
- Validate at trust boundaries; do not rely only on form validation.
- Add tests with the implementation.
- Update documentation and `.env.example` in the same pull request.

Local gate:

```bash
npm run check
npm run security:deps
npm run build
```

## 4. Testing

Required:

- Unit tests for changed business and security logic
- Integration checks for APIs or database contracts
- Browser verification for changed user workflows
- Permission-negative tests for protected functionality
- Preview deployment smoke test

Exit gate: CI is green, acceptance criteria are demonstrated, and no unresolved high-severity defect remains.

## 5. Deployment

- Merge only after required review and CI.
- Vercel creates Preview deployments for pull requests.
- Production deploys from the protected default branch.
- Verify health, critical navigation, authentication, and affected data writes.
- Roll back the Vercel deployment immediately if core flows or data integrity regress.

## 6. Maintenance

Weekly:

- Review failed jobs, logs, user reports, and dependency pull requests.

Monthly:

- Audit catalog availability and AI-native fit.
- Review access, Supabase policies, stale secrets, analytics, and performance.
- Test backups and review error trends.

Quarterly:

- Restore-test the database, rotate privileged integration keys, review threat assumptions, and retire unused dependencies and routes.

## Change Classes

| Class | Examples | Minimum review |
| --- | --- | --- |
| Low | Copy, isolated style, test-only | CI and one reviewer |
| Medium | New UI flow, query, API behavior | CI, Preview, owner review |
| High | Auth, RLS, payments, destructive migration | Security review, rollback plan, staged release |
