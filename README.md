# Listen Direct

Listen Direct is a Nuxt 4 product prototype for operating reliable, privacy-aware, audio-native AI applications. It combines a marketing site, an honest browser-only product simulation, a Supabase-backed identity layer, and a role-aware operations dashboard.

## Current project status

- The Nuxt application, dashboard, authentication flows, legal pages, and DevSecOps baseline are implemented in this workspace.
- The hosted Supabase `listen-direct` project is linked and its initial database migration is applied.
- Registration requires email confirmation and a password of at least 12 characters.
- User and administrator accounts persist generated voice turns and data-policy settings; demo-role writes are blocked by the API and database.
- Visitors can launch a passwordless guest sandbox at `/dashboard?demo=1`; it uses only browser-local representative data and cannot call protected APIs.
- The guest sandbox includes a three-step tour for choosing a route, generating a representative turn, and inspecting its evidence.
- The public Help Center includes 12 detailed guides and a browser-local AI Help Assistant that maps questions to documented steps without sending data to an external model.
- Simulation labels distinguish representative metrics, models, pricing, and responses from connected production services.
- Local type checking, production builds, schema linting, secret scanning, dependency auditing, and end-to-end Supabase tests pass.
- The current source changes still need to be committed, pushed, and redeployed before they replace the existing public `chatgpt.site` build.
- Microphone capture, realtime audio-model calls, billing, production SMTP, recovery flows, invitations, and administrator MFA remain future work.

## What it is

Listen Direct is a concept and interactive product demo for voice-AI infrastructure. It shows how an application can send a completed voice turn directly to an audio-capable AI model instead of requiring speech-to-text first.

The current Nuxt application presents and demonstrates the product concept; it does not request microphone access or include a realtime audio-processing backend.

## Intended production architecture

1. The user speaks.
2. Voice-activity detection determines when the turn ends.
3. The original audio is sent directly to an audio-capable AI model.
4. The model can interpret the words alongside pitch, pace, emphasis, emotion, and interruptions.
5. The response is streamed back as speech.
6. If direct audio processing is unavailable or unreliable, the system falls back to a speech-to-text → language model → text-to-speech pipeline.

The dashboard currently simulates this sequence with representative data. No microphone audio is captured, no AI provider is called, and the pricing tiers are an early-access preview rather than active billing plans.

## Who it helps

Listen Direct is designed for teams building:

- Voice assistants and conversational agents
- Customer-service and call-center automation
- Coaching and interview-practice tools
- Language-learning products
- Accessibility software
- Games and interactive characters
- Hands-free workplace applications

## Business model

The strongest opportunity is to sell the infrastructure that makes audio-native AI reliable, observable, and safe to deploy. Potential revenue streams include:

- A usage-based API with pricing per processed audio minute
- SDK subscriptions for routing, interruption handling, and model compatibility
- Observability and evaluation dashboards for development teams
- Enterprise contracts for privacy controls, audit logs, and private deployments
- Integration and consulting services for early customers

A practical initial offer is: **“Add reliable audio-native AI to your application with one SDK.”** Charge a monthly platform fee plus usage, then expand into enterprise contracts after proving the routing, monitoring, privacy, and fallback systems.

## Development

Requires Node.js 22.19+, 24.11+, or 26+.

Recommended local runtime: Node.js 24 LTS.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Then open <http://localhost:3000>.

To explore without an account, open <http://localhost:3000/dashboard?demo=1>. The guided sandbox is browser-only and cannot read or write protected workspace APIs.

Set `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY` in `.env` using the project URL and publishable key from the Supabase dashboard. Apply the committed database migration before creating the first account:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The local `.env` file is ignored by Git. Never expose a Supabase secret key or legacy service-role key in Nuxt public configuration.

For Netlify, configure the same two public values as `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY`. Do not configure `SUPABASE_SECRET_KEY` or a service-role key: all application queries run as the signed-in user and are authorized by Row Level Security. The committed `netlify.toml` keeps secret scanning enabled while excluding only the browser-safe URL and publishable key from value matching.

The workspace is already linked to the hosted `listen-direct` Supabase project. The commands above are primarily for a fresh clone or a different Supabase project.

## Authentication

Listen Direct uses Supabase Auth with server-side rendering cookie support. Email/password sign-in and registration are available at `/login`; sensitive server endpoints independently resolve the signed-in user and enforce workspace roles. New registrations create a workspace, profile, default data policy, and administrator membership through a database trigger.

The application provides four access paths. Guest sandbox is an experience mode, not a persisted workspace role:

| Access path | Authentication | Persistence | Access |
| --- | --- | --- | --- |
| Guest sandbox | None | Current browser session only | Guided representative dashboard; protected APIs unavailable |
| Demo account | Supabase session | Simulated turns remain session-only | Read-only policies and safe product exploration |
| User | Supabase session | Supabase | Persistent voice turns and policy management |
| Admin | Supabase session | Supabase | User access plus the protected workspace identity directory |

PostgreSQL row-level security limits profiles, memberships, turns, policies, and audit records to the appropriate signed-in workspace. The application never requires a service-role key.

## Application routes

- `/` — product landing page and architecture overview
- `/login` — role-aware authentication
- `/dashboard` — authenticated operations dashboard for simulated turns, AI-assisted notification triage, session review, model routing, audio evaluations, and acoustic-data controls
- `/dashboard?demo=1` — passwordless, browser-only guest sandbox with guided onboarding, representative notification correction, and no protected API access
- `/admin` — administrator-only identity and audit overview
- `/help` — 12 detailed product guides plus a guide-grounded, browser-local AI Help Assistant for direct answers and documented next steps
- `/privacy` — privacy policy, cookie inventory, voice-data notice, and user choices
- `/terms` — acceptable-use, account, voice/AI, disclaimer, and service terms

The dashboard still simulates microphone capture, model responses, notifications, and AI correction suggestions, but signed-in user and administrator accounts now persist generated voice-turn records and data-policy settings in Supabase PostgreSQL. The Help Assistant uses deterministic in-browser guide matching rather than a generative provider. Live audio, model APIs, durable notifications, action-executing assistants, aggregate metrics, evaluations, and billing require additional backend integrations.

## Cookies and legal notices

The application shows a global cookie notice on first visit. Essential authentication and preference cookies are always available; optional analytics default to off and can be enabled only through an explicit choice. Users can reopen **Cookie settings** from the lower-left corner at any time.

The current cookie inventory is:

| Cookie | Purpose | Duration |
| --- | --- | --- |
| `sb-<project-ref>-auth-token` (may be chunked) | Supabase authentication session | Up to 8 hours per application cookie |
| `ld-cookie-preferences` | Remembers essential-only or analytics choice | 180 days |

No analytics provider is connected yet. The Privacy Policy and Terms of Use describe the current prototype accurately, but they are product drafts—not legal advice—and require operator details, governing terms, vendor disclosures, and qualified legal review before a production launch.

## DevSecOps

The repository includes a security baseline for local development and GitHub:

- `npm run security:secrets` scans source files for high-confidence credentials and unsafe secret filenames.
- `npm run security:audit` fails on high or critical npm advisories.
- GitHub CI installs the lockfile with lifecycle scripts disabled, scans for secrets, audits production dependencies, and builds the application.
- CodeQL runs extended JavaScript and TypeScript security queries on pushes, pull requests, and a weekly schedule.
- Dependabot checks npm packages and pinned GitHub Actions weekly.
- Runtime middleware adds CSP, anti-framing, MIME-sniffing, referrer, permissions, cross-origin, and HSTS headers.
- Login failures are limited to five attempts per IP-and-email pair in a 15-minute window.
- Guest mode bypasses only the `/dashboard` page middleware; server endpoints and Supabase row-level security continue to require an authenticated, authorized user.

See [`docs/devsecops.md`](docs/devsecops.md) for repository settings, deployment requirements, and the limits of the prototype controls.

## Project documentation

- [`docs/updates.md`](docs/updates.md) — completed changes and verification history
- [`docs/issues.md`](docs/issues.md) — known limitations, risks, and recommended fixes
- [`docs/learn.md`](docs/learn.md) — product, architecture, and commercialization lessons
- [`docs/help.md`](docs/help.md) — durable help-center content and operator how-tos
- [`docs/devsecops.md`](docs/devsecops.md) — security gates, GitHub controls, and deployment checklist
- [`SECURITY.md`](SECURITY.md) — vulnerability reporting and security scope

Create a production build with `npm run build`, or generate a static deployment with `npm run generate`.

Run `npm run typecheck` to validate Vue, Nuxt, and server TypeScript before building.

## Before production

1. Commit, push, and deploy the current Nuxt source with the Supabase public environment variables configured on the hosting platform.
2. Configure a production SMTP provider and test confirmation and recovery emails end to end.
3. Add password recovery, account deletion, workspace invitations, and administrator MFA.
4. Rotate or disable unused legacy Supabase JWT keys and continue using only the publishable key in browser-facing configuration.
5. Complete legal review, monitoring, backups, distributed rate limiting, incident response, and live audio-provider integration.
