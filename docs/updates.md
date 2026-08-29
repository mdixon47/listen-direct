# Project Updates

This document records meaningful product and implementation changes to Listen Direct.

## 2026-08-29 — Engineering hardening and regression coverage

### Fixed

- Kept passwordless guest access limited to the exact `/dashboard?demo=1` route through a testable route helper.
- Required authentication before request-body parsing on voice-turn creation and data-policy updates, so anonymous callers consistently receive an authorization failure.
- Replaced focusable table-row behavior with a native turn button and visible keyboard focus treatment.
- Extracted dashboard source styles and static representative data from the page into dedicated files.
- Expanded the previously minified landing-page CSS into reviewable source formatting and added a pinned formatter.
- Added `.nvmrc` with the supported Node.js 24.11 runtime.
- Expanded local secret detection for npm, Slack, Stripe, Supabase, SendGrid, Google, Twilio, and Netlify token formats.

### Added

- Added unit tests for the exact guest-route exception and fixed-window login failure limiter.
- Added a production-server integration test covering guest rendering, authenticated dashboard redirects, protected reads, and protected writes.
- Added `format`, `format:check`, `test`, `test:integration`, and `verify` scripts.
- Extended GitHub CI with formatting, unit-test, and built-server authorization-boundary gates.

### Remaining boundaries

- Realtime audio, distributed login throttling, full account lifecycle, durable notifications, billing, privacy deletion jobs, and deployment-specific legal review still require external services or product decisions.
- The CSP still permits inline scripts and styles because Nuxt hydration and reactive style bindings have not yet been migrated to a nonce/hash architecture.

## 2026-08-24 — Guide-grounded AI Help Assistant

### Added

- Expanded the public Help Center with an interactive assistant grounded in all 12 maintained product guides.
- Added free-form questions, five high-value starter prompts, documented match scoring, match-strength labels, and three-step action previews.
- Added clear source attribution, full-guide handoff, related application links, a three-answer browser history, session clearing, keyboard submission, loading feedback, and responsive layouts.
- Added privacy reminders and an explicit disclosure that the assistant is a representative browser-local experience.
- Hardened the Help Center for mobile and tablet screens with constrained guide grids, contained horizontal filters, stacked assistant actions, larger touch targets, readable answer text, and mobile-safe form sizing.

### Verified

- The Help Center has no page-level horizontal overflow at 390px phone and 768px tablet widths.
- Assistant prompts, clearing, full-guide handoff, related links, and submission controls meet a minimum 44px mobile touch target.
- A representative notification question returns the correct guide and action steps on mobile.

### Product boundary

- The Help Assistant does not call an external generative model, inspect private workspace records, execute changes, or persist questions. It deterministically matches the question to maintained help content and leaves operational action under the user’s control.

## 2026-08-24 — AI-assisted notification center

### Added

- Added Notifications as a first-class dashboard tab and connected the header badge to the inbox.
- Added Open, Needs assistance, Resolved, and All filters with severity, source, category, timing, and related-turn context.
- Added a representative AI correction assistant that produces a diagnosis, bounded plan, and exact suggested change.
- Added explicit operator approval before a correction can update routing or privacy state.
- Added manual resolution, reopening, related-turn navigation, resolution evidence, responsive layouts, and keyboard focus treatment.
- Added notification how-tos to the in-app Help center and project documentation.

### Product boundary

- Notifications, assistant analysis, and corrections remain browser-local representative data. No external AI provider is called, and production execution will require authenticated backend authorization and durable audit logging.

## 2026-08-22 — Honest instant-demo experience

### Added

- Added a passwordless guest sandbox at `/dashboard?demo=1` that uses browser-local representative data and never calls protected APIs.
- Added a three-step guided start covering route selection, sample-turn generation, and session inspection.
- Added seeded representative turns so the dashboard communicates value immediately.
- Added keyboard access and focus treatment to recent-turn rows.
- Updated every project Markdown file to document the guest workflow, simulation boundaries, security model, current gaps, and lessons learned consistently.

### Changed

- Replaced live-input language with explicit interactive-simulation labeling across the product and dashboard.
- Marked pricing as a preview because billing and usage metering are not active.
- Disabled provider-registration and evaluation-runner actions that are not connected yet.
- Added instant-demo calls to action across the landing, sign-in, and Help experiences.
- Renamed the dashboard overview and system status so they no longer imply connected production traffic or measured uptime.

### Security boundary

- Guest mode bypasses only the dashboard page middleware. Supabase-backed APIs, persisted workspace data, and administration remain protected by server authentication and row-level security.

### Verified

- `npm run typecheck` passes.
- `npm run build` completes successfully.
- Repository secret scanning passes and the npm audit reports zero vulnerabilities.
- `/dashboard?demo=1` renders anonymously with HTTP 200.
- Anonymous requests to `/api/auth/me` and `/api/voice/turns` return HTTP 401.
- `git diff --check` reports no whitespace errors.

## 2026-08-19 — Documentation and handoff refresh

### Changed

- Expanded `README.md` with the current implementation status, hosted Supabase state, completed verification, and remaining production work.
- Clarified that the Supabase migration and Auth configuration are live while the updated Nuxt source still requires commit, push, and redeployment.
- Added production handoff guidance for SMTP, recovery flows, invitations, administrator MFA, legacy-key rotation, monitoring, backups, legal review, and live audio integration.

### Current handoff state

- The local `.env` is ignored and contains only the Supabase project URL and publishable browser key.
- No Supabase secret or service-role key is required by the application.
- The repository changes are intentionally left uncommitted for the next commit-and-deploy step.

## 2026-08-19 — Supabase authentication and persistence

### Added

- Replaced static development identities with Supabase email/password authentication and self-service registration.
- Added organization, profile, membership, voice-session, voice-turn, data-policy, and audit-event database tables.
- Added a signup trigger that provisions each new account with a workspace, administrator membership, and default policy.
- Added row-level security policies and least-privilege grants for demo, user, and administrator roles.
- Added server-verified current-user, signup, sign-in, sign-out, workspace, member-directory, voice-turn, and data-policy endpoints.
- Persisted generated voice turns and privacy-policy settings for user and administrator accounts; demo-role turns remain session-only.
- Added Supabase environment placeholders and CI build configuration without requiring a service-role key.

### Verified

- The Nuxt production build completes with non-production Supabase placeholders.
- Nitro bundles the Supabase server helpers in one chunk without circular dependency warnings.
- Server routes compile against the generated database types.
- A clean local Supabase reset applies the migration and reports no schema lint errors.
- Local end-to-end tests pass for registration, email confirmation, login, SSR cookies, workspace provisioning, admin access, persisted turns, and policy updates.
- Demo-role writes are rejected by both the Nuxt APIs and direct PostgREST access under row-level security.
- The hosted `listen-direct` project is linked, the migration is applied, local and remote migration histories match, and remote schema lint reports no errors.
- Hosted Auth uses the deployed Listen Direct URL as its site URL and permits the deployed and local-development redirect URLs.
- Hosted Auth requires email confirmation and a minimum 12-character password, matching the application validation.
- The ignored local `.env` contains only the hosted project URL and publishable key; no service-role key is required.
- Type checking, production build, repository secret scan, and production dependency audit pass.

## 2026-08-19 — DevSecOps baseline

### Added

- Added a local, dependency-free secret scanner and npm security scripts.
- Added hardened response headers and no-store API responses.
- Added a process-local login failure limit of five attempts per IP-and-email pair per 15 minutes.
- Added least-privilege GitHub CI with lockfile installation, secret scanning, dependency auditing, and production builds.
- Added CodeQL extended JavaScript/TypeScript analysis on pull requests, main-branch pushes, and a weekly schedule.
- Added weekly Dependabot updates for npm and GitHub Actions.
- Pinned every workflow action to a verified full commit SHA.
- Added a pull-request security checklist and private vulnerability disclosure policy.
- Added `docs/devsecops.md` with operating instructions and production requirements.

### Verified

- The repository secret scan passes.
- The production dependency audit reports zero vulnerabilities.
- The Nuxt production build completes successfully.
- Runtime responses include the configured security headers.
- Five invalid sign-in attempts return 401 and the sixth returns 429.
- The secured production build hydrates, authenticates, and opens the dashboard without console warnings or errors.

## 2026-08-19 — Cookie controls, privacy, and terms

### Added

- Added a global first-visit cookie notice with **Accept all**, **Essential only**, and granular customization actions.
- Kept optional analytics disabled unless the user actively enables it.
- Added a persistent **Cookie settings** control so choices can be reviewed or changed later.
- Added a 180-day `ld-cookie-preferences` cookie containing the selected category, consent version, and update time.
- Added a public `/privacy` policy with the current cookie inventory, authentication practices, simulated-audio disclosure, retention summary, and user choices.
- Added public `/terms` covering demo status, accounts, acceptable use, voice/AI responsibilities, ownership, disclaimers, liability, and termination.
- Linked Privacy and Terms from the landing page, login page, dashboard, and administration area.

### Verified

- The first-visit notice appears and clearly separates essential and optional categories.
- Essential-only selection closes the notice and preserves access to Cookie settings.
- Cookie settings reopen and display the saved category state.
- Privacy and Terms pages render successfully and remain public.
- `npm run build` completes successfully.
- Browser verification reported no console warnings or errors.

## 2026-08-19 — Initial role-based authentication (superseded)

### Added

- Added `nuxt-auth-utils` encrypted, sealed-cookie sessions.
- Added scrypt password verification with constant-time hash comparison.
- Added demo, user, and administrator development identities.
- Added a role-aware `/login` experience with safe post-login redirects.
- Protected `/dashboard` with authentication middleware.
- Added a protected `/admin` identity and audit overview.
- Added server-side authorization to `/api/admin/users`.
- Added a protected user overview API to demonstrate server-enforced sessions.
- Added role-aware workspace, profile, sign-out, demo, and administration states in the dashboard.
- Added `.env.example` guidance for the session-encryption secret.

This fixture-based implementation was subsequently replaced by the Supabase authentication and persistence layer documented above.

### Verified

- Invalid credentials return HTTP 401.
- Unauthenticated dashboard requests redirect to `/login`.
- Demo and user sessions can access protected user data but receive HTTP 403 from admin APIs.
- User navigation to `/admin` redirects back to `/dashboard`.
- Administrator sessions can open `/admin` and retrieve the protected identity directory.
- Login, logout, role navigation, and admin rendering pass browser verification without console errors.

## 2026-08-19 — Nuxt dashboard

### Added

- Created the `/dashboard` operations experience.
- Added a simulated voice-turn console with waveform activity, elapsed time, processing state, and generated turn records.
- Added adaptive, direct-audio, and standard STT routing controls.
- Added operational metrics for direct-route rate, latency, turn success, and fallbacks.
- Added searchable session history with route, signal, model, latency, and status data.
- Added a model-capability registry with selectable primary models.
- Added audio-native evaluation results and direct-versus-cascaded comparisons.
- Added acoustic-data controls for shadow transcripts, consent-aware logging, signal exposure, and raw-audio retention.
- Added responsive layouts for desktop, tablet, and mobile sizes.
- Connected the landing-page navigation to the dashboard.
- Documented application routes and the current demo limitations in `README.md`.

### Changed

- Restructured the Nuxt application to use file-based routes:
  - `app/pages/index.vue` for the landing page.
  - `app/pages/dashboard.vue` for operations.
  - `app/app.vue` as the root route outlet.
- Replaced direct DOM manipulation with Vue reactive state.
- Converted repeated dashboard content into data-driven Vue loops.

### Verified

- `npm run build` completes successfully with Nuxt 4.5.2.
- Landing-page navigation reaches `/dashboard`.
- Simulated-turn start, stop, processing, and session insertion work.
- Session search, model selection, evaluation navigation, routing controls, and policy output work.
- Browser verification reported no console warnings or errors.

## 2026-08-19 — Initial Nuxt recreation

- Recreated the Listen Direct marketing experience from the deployed reference site.
- Preserved the responsive layout, visual identity, animated waveform, and pipeline modes.
- Migrated the project to Nuxt 4 and TypeScript.
- Added production build and static-generation scripts.
- Added a product overview, target users, and monetization strategy to `README.md`.
