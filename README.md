# Listen Direct

Nuxt 4 recreation of the Listen Direct site.

## What it is

Listen Direct is a concept and interactive product demo for voice-AI infrastructure. It shows how an application can send a completed voice turn directly to an audio-capable AI model instead of requiring speech-to-text first.

The current Nuxt application presents and demonstrates the product concept; it does not yet include the live audio-processing backend.

## How it works

1. The user speaks.
2. Voice-activity detection determines when the turn ends.
3. The original audio is sent directly to an audio-capable AI model.
4. The model can interpret the words alongside pitch, pace, emphasis, emotion, and interruptions.
5. The response is streamed back as speech.
6. If direct audio processing is unavailable or unreliable, the system falls back to a speech-to-text → language model → text-to-speech pipeline.

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

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Authentication

Listen Direct uses `nuxt-auth-utils` sealed, HTTP-only cookie sessions. The dashboard requires authentication, server APIs independently verify sessions, and the admin directory requires the `admin` role.

Development accounts:

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Demo | `demo@listen.direct` | `demo1234` | Temporary dashboard sandbox |
| User | `user@listen.direct` | `user1234` | Standard voice-operations dashboard |
| Admin | `admin@listen.direct` | `admin1234` | Dashboard and protected administration area |

For deployment, set a unique `NUXT_SESSION_PASSWORD` containing at least 32 characters. See `.env.example`; never commit the real value. The included identities are development fixtures and must be replaced with a database or external identity provider before production.

## Application routes

- `/` — product landing page and architecture overview
- `/login` — role-aware authentication
- `/dashboard` — interactive operations dashboard for live turns, session review, model routing, audio evaluations, and acoustic-data controls
- `/admin` — administrator-only identity and audit overview
- `/privacy` — privacy policy, cookie inventory, voice-data notice, and user choices
- `/terms` — acceptable-use, account, voice/AI, disclaimer, and service terms

The dashboard currently uses realistic local demo data and client-side simulations. Connecting live microphone capture, model APIs, persistent storage, and billing requires additional backend integrations.

## Cookies and legal notices

The application shows a global cookie notice on first visit. Essential authentication and preference cookies are always available; optional analytics default to off and can be enabled only through an explicit choice. Users can reopen **Cookie settings** from the lower-left corner at any time.

The current cookie inventory is:

| Cookie | Purpose | Duration |
| --- | --- | --- |
| `nuxt-session` | Sealed authentication and role session | 2 hours for demo; 8 hours for users/admins |
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

See [`docs/devsecops.md`](docs/devsecops.md) for repository settings, deployment requirements, and the limits of the prototype controls.

## Project documentation

- [`docs/updates.md`](docs/updates.md) — completed changes and verification history
- [`docs/issues.md`](docs/issues.md) — known limitations, risks, and recommended fixes
- [`docs/learn.md`](docs/learn.md) — product, architecture, and commercialization lessons
- [`docs/devsecops.md`](docs/devsecops.md) — security gates, GitHub controls, and deployment checklist

Create a production build with `npm run build`, or generate a static deployment with `npm run generate`.
