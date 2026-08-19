# DevSecOps Guide

This project treats security checks as part of development, review, deployment, and runtime operation. The included controls form a useful prototype baseline; they do not make the application production-ready by themselves.

## Local security gates

Run these before opening a pull request:

```bash
npm run security:secrets
npm audit --omit=dev --audit-level=high
NUXT_PUBLIC_SUPABASE_URL="https://example.supabase.co" \
NUXT_PUBLIC_SUPABASE_KEY="sb_publishable_local_placeholder" \
npm run build
```

`security:secrets` checks source files for common private keys and access tokens, rejects sensitive filenames unless Git ignores them, and verifies required `.gitignore` rules. It intentionally avoids package dependencies and network access. The npm audit uses the public advisory service and therefore requires network access.

Never commit a real `.env` file, deployment secret, model-provider key, customer audio, transcript, or personal data. `.env.example` must contain placeholders only.

## Automated pipeline

### CI and security

`.github/workflows/ci.yml` runs on pull requests, main-branch pushes, and manual dispatch. It:

1. Uses read-only repository permissions.
2. Pins GitHub-maintained actions to full commit SHAs.
3. Uses Node.js 24 LTS and the committed npm lockfile.
4. Installs dependencies with lifecycle scripts disabled.
5. Scans the repository for exposed secrets.
6. Fails on high or critical production dependency advisories.
7. Type-checks the Nuxt client and server code.
8. Builds the production application with non-production Supabase URL and publishable-key placeholders.

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
