# DevSecOps Guide

This project treats security checks as part of development, review, deployment, and runtime operation. The included controls form a useful prototype baseline; they do not make the application production-ready by themselves.

## Local security gates

Run these before opening a pull request:

```bash
nvm use
npm run verify
```

`verify` checks formatting and TypeScript, runs unit regressions, scans for secrets, audits dependencies, builds the production server, and exercises the anonymous guest/authentication boundary against that build. `security:secrets` checks source files for private keys and common vendor tokens, rejects sensitive filenames unless Git ignores them, and verifies required `.gitignore` rules. It intentionally avoids network access. The npm audit uses the public advisory service and therefore requires network access.

Never commit a real `.env` file, deployment secret, model-provider key, customer audio, transcript, or personal data. `.env.example` must contain placeholders only.

## Guest sandbox security model

The instant demo at `/dashboard?demo=1` is intentionally public, but only as a browser-local product simulation:

1. Route middleware permits that exact dashboard path and query combination without a Supabase session.
2. The dashboard selects a local guest identity, seeded turns, and browser-memory state.
3. Guest mode does not request `/api/auth/me`, `/api/voice/turns`, or `/api/data-policy`.
4. Server routes still resolve authenticated users and enforce workspace roles independently.
5. PostgreSQL row-level security remains active for every Supabase-backed operation.

Treat `demo=1` only as a presentation-mode flag. It must never be accepted as proof of identity, workspace membership, or authorization. The committed unit and production-server integration tests guard this boundary; extend them whenever middleware, dashboard data loading, or protected APIs change.

## Automated pipeline

### CI and security

`.github/workflows/ci.yml` runs on pull requests, main-branch pushes, and manual dispatch. It:

1. Uses read-only repository permissions.
2. Pins GitHub-maintained actions to full commit SHAs.
3. Uses Node.js 24 LTS and the committed npm lockfile.
4. Installs dependencies with lifecycle scripts disabled.
5. Scans the repository for exposed secrets.
6. Fails on high or critical production dependency advisories.
7. Checks deterministic source formatting.
8. Type-checks the Nuxt client and server code.
9. Runs unit regression tests.
10. Builds the production application with non-production Supabase URL and publishable-key placeholders.
11. Runs the guest and protected-route integration checks against the built server.

### Code scanning

`.github/workflows/codeql.yml` runs the `security-extended` JavaScript and TypeScript query suite. CodeQL is available for public repositories and for eligible private repositories with GitHub Code Security enabled. Do not enable a second, overlapping CodeQL setup for the same repository.

### Dependency maintenance

`.github/dependabot.yml` checks npm and GitHub Actions each Monday. Action updates retain immutable SHA pinning while Dependabot proposes reviewed changes.

## Runtime controls

The server adds these controls to responses:

- A same-origin Content Security Policy with framing and plugin execution disabled
- `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`
- Restricted camera, location, and microphone permissions
- Strict referrer and cross-origin policies
- HSTS for HTTPS deployments
- `no-store` caching for API responses

The login endpoint permits five failed attempts for an IP-and-email pair during a 15-minute window. A sixth attempt returns HTTP 429 with `Retry-After`.

These counters are process-local. A production, multi-instance deployment must use a shared rate-limit store and a correctly configured trusted proxy. Production authentication must also enable administrator MFA and complete recovery, invitation, and account-lifecycle flows.

## Required GitHub settings

Repository files cannot enable every platform protection. After pushing, configure:

1. Branch protection or a ruleset for `main` that requires pull requests and the CI checks.
2. Dependabot alerts and security updates.
3. Secret scanning and push protection where available.
4. Code scanning if the repository's visibility and license support it.
5. Private vulnerability reporting.
6. Restricted GitHub Actions permissions, with workflow tokens read-only by default.
7. Review requirements for workflow, authentication, authorization, privacy, and dependency changes.

## Production deployment checklist

- Configure the production `NUXT_PUBLIC_SUPABASE_URL` and Supabase publishable key. These values are browser-visible identifiers, not administrator secrets.
- On Netlify, do not add `SUPABASE_SECRET_KEY` or a service-role key. The application does not use an admin client; authorization is enforced through user sessions and Row Level Security. The committed Netlify configuration omits only the expected public Supabase URL/key from value scanning and leaves secret scanning enabled for all private variables.
- Verify anonymous access to `/dashboard?demo=1` succeeds while every protected API continues to reject the same anonymous client.
- Never expose a Supabase secret key or legacy service-role key in Nuxt public configuration or a browser bundle.
- Apply database migrations through a protected deployment identity and review every row-level security policy before launch.
- Enable administrator MFA, verified email, password recovery, workspace invitations, and account-deletion handling.
- Terminate traffic with TLS and confirm HSTS is appropriate for every subdomain before preload submission.
- Configure a trusted reverse proxy and a distributed rate-limit store.
- Remove CSP inline allowances by adopting nonces or hashes.
- Inventory model, hosting, monitoring, database, and analytics vendors.
- Define audio, transcript, log, backup, and deletion retention periods.
- Add centralized audit logs, alerts, backups, incident response, and restoration testing.
- Run an independent application security review before processing real voice or personal data.

## Vulnerability response

Follow `SECURITY.md`. Do not place vulnerability details or secrets in public issues. Triage reports by exploitability and potential impact, revoke exposed credentials immediately, preserve relevant audit evidence, patch through a reviewed pull request, and document follow-up prevention work.
