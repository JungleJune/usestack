# Security Policy

## Reporting

Report vulnerabilities privately to the repository owner. Do not open a public issue containing credentials, exploit details, or user data.

## Secret Handling

- Store local secrets in `.env.local`.
- Store Preview and Production secrets in Vercel.
- Never expose service-role, SMTP, agent, OAuth secret, or AI provider keys through `NEXT_PUBLIC_*`.
- Rotate a credential immediately if it appears in source, logs, screenshots, or chat.

## Immediate Repository Action

A Gmail app password previously existed in committed source. Revoke it at the provider, replace it with the SMTP variables in `.env.example`, and purge it from Git history using an agreed history-rewrite procedure. Removing it from the latest commit does not remove it from earlier commits or forks.

## Supported Security Controls

- NextAuth role checks for admin pages and APIs
- Server-only service-role access
- Bounded request input and rate limiting
- SSRF protection for user-provided URLs
- HTML sanitization and email escaping
- Content Security Policy and defensive response headers
- Secret, dependency, and CodeQL checks in CI

## Response

For a confirmed incident: contain access, rotate affected credentials, preserve logs, assess data exposure, patch and verify, notify affected parties when required, and document preventive actions.
