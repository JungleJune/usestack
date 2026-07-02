# Testing Strategy

## Test Layers

1. Static checks: ESLint and TypeScript catch unsafe or inconsistent code.
2. Unit tests: pure product filtering and security helpers.
3. API integration tests: required next for auth, agent, and admin proxy routes.
4. Browser tests: critical discovery, login, admin, submission, and workflow journeys.
5. Production smoke tests: navigation, asset loading, authentication, and one non-destructive read.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run security:secrets
npm run security:deps
npm run build
```

Run `npm run ci` before opening a pull request.

## Required Tests by Change

| Change | Required coverage |
| --- | --- |
| Pure utility | Unit tests for success, boundary, and invalid input |
| API route | Auth failure, validation failure, success, upstream failure |
| Admin behavior | Unauthenticated, wrong role, valid admin, destructive confirmation |
| Search/filter | Query, category, tag, combined filters, no results |
| Database migration | Forward migration, representative data check, rollback or recovery |
| Visual change | Desktop and mobile screenshots plus keyboard check |

## CI Policy

- Pull requests and default-branch pushes run install, lint, typecheck, tests, secret scan, dependency audit, and production build.
- CodeQL runs on pull requests, pushes, and a weekly schedule.
- Dependency Review blocks newly introduced vulnerable packages when GitHub supports it for the repository.
- Dependabot opens monthly npm and GitHub Actions updates.

## Current Gaps

- Add route-level integration tests with a disposable Supabase project.
- Add browser smoke tests to CI once test data and credentials are isolated.
- Add accessibility automation with axe.
- Add contract tests for RLS policies after migrations are versioned.
