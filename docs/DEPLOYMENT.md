# Deployment and Maintenance

## Environments

- Local: `.env.local`, developer Supabase project preferred
- Preview: Vercel Preview environment and non-production integrations
- Production: protected branch, production Supabase, SMTP, OAuth, and AI keys

Never use the production service-role key in a Preview environment connected to an untrusted branch.

## Vercel Configuration

Add every variable listed in `.env.example`. At minimum, production needs:

- NextAuth secret and URL
- Supabase URL, publishable key, and service-role key
- Gemini key
- Agent key if agent routes are enabled
- SMTP host, port, user, password, sender, and destination addresses
- Google OAuth credentials if Google sign-in is enabled

After changing variables, redeploy; existing deployments do not automatically receive the new values.

## Release Process

1. Confirm acceptance criteria and migration plan.
2. Run `npm run ci` and `npm run security:deps`.
3. Verify the Vercel Preview on desktop and mobile.
4. Merge after review and required checks.
5. Watch the production deployment and logs.
6. Smoke-test home, explore, a product page, login, and the changed workflow.

## Rollback

For application regressions, promote the last known-good Vercel deployment. For data changes, use the documented migration recovery path; application rollback does not undo database writes.

Never make destructive schema changes in the same release that removes all code compatibility. Use expand, migrate, verify, then contract.

## Maintenance Schedule

- Weekly: failed CI, runtime errors, submissions, reports, dependency PRs
- Monthly: tool availability audit, access review, dependency audit, performance review
- Quarterly: database restore test, key rotation, RLS review, disaster-recovery drill

## Tool Catalog Audit

The monthly curation process should record:

- Active, shut down, acquired, redirected, or unverifiable
- AI-native versus incumbent AI feature
- Founded year and source
- Last material launch/update
- Keep, hide, remove, or needs-review decision

Do not hard-delete uncertain records. Hide them and preserve the audit reason until confirmed.
