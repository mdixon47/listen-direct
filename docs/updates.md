# Project Updates

This document records meaningful product and implementation changes to Listen Direct.

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

## 2026-08-19 — Role-based authentication

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
- Added a simulated live voice-turn console with waveform activity, elapsed time, processing state, and generated turn records.
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
- Live-turn start, stop, processing, and session insertion work.
- Session search, model selection, evaluation navigation, routing controls, and policy output work.
- Browser verification reported no console warnings or errors.

## 2026-08-19 — Initial Nuxt recreation

- Recreated the Listen Direct marketing experience from the deployed reference site.
- Preserved the responsive layout, visual identity, animated waveform, and pipeline modes.
- Migrated the project to Nuxt 4 and TypeScript.
- Added production build and static-generation scripts.
- Added a product overview, target users, and monetization strategy to `README.md`.
