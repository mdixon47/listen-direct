# Security Policy

## Supported version

Security fixes are applied to the latest code on the `main` branch. This repository currently represents a prototype, not a production service.

## Reporting a vulnerability

Do not disclose suspected vulnerabilities, credentials, personal data, or exploit details in a public issue.

Use GitHub private vulnerability reporting when it is enabled for the repository. Otherwise, contact the repository owner through a private channel and include:

- The affected route, component, or commit
- A concise impact statement
- Reproduction steps or a minimal proof of concept
- Any known workarounds

Please allow reasonable time for validation and remediation before public disclosure. Never test against systems, accounts, or data you do not own or have explicit permission to assess.

## Security scope

High-priority reports include authentication or authorization bypass, session compromise, exposed secrets, injection, cross-site scripting, sensitive voice-data disclosure, and unsafe dependency or workflow behavior.

## Current prototype boundaries

- `/dashboard?demo=1` is an intentional browser-only guest experience. It bypasses only dashboard page middleware and must never grant access to protected APIs, persisted workspaces, or administrator functions.
- Supabase-backed endpoints independently require an authenticated user, workspace membership, and the appropriate role. PostgreSQL row-level security remains the final data boundary.
- The dashboard does not capture microphone audio or call an AI provider. Turns, metrics, models, evaluations, and pricing shown in the simulation are representative.
- Supabase project URLs and publishable keys are browser-visible identifiers. Secret keys and legacy service-role keys must never be committed, placed in public Nuxt configuration, or bundled for the browser.

The shared demo account, guest identity, and simulated dashboard data are public development fixtures. They must not be reused as production identities, credentials, operational records, or performance claims.
