# Contributing

## Workflow

1. Open or link an issue with acceptance criteria.
2. Create a focused branch.
3. Implement the smallest coherent change with tests.
4. Run `npm run ci` and `npm run security:deps`.
5. Open a pull request and verify its Vercel Preview.
6. Merge only after required checks and review.

## Engineering Rules

- Use Node 22 and npm. Do not add a second lockfile.
- Keep service credentials in server-only modules.
- Validate input at API and database boundaries.
- Use the admin Supabase client for admin data access.
- Add dependencies only when existing platform or standard APIs are insufficient.
- Update documentation for new variables, routes, policies, or operational steps.

## Pull Requests

Keep pull requests reviewable. Include the problem, solution, test evidence, security/data impact, screenshots for UI changes, and rollback notes for high-risk changes.
