# Issues and Gaps

This file tracks known limitations and the work required to turn the current product demo into a production service.

## Critical product gaps

### Realtime audio is not implemented

The dashboard does not currently capture microphone input, run voice-activity detection, stream audio, or call an audio-capable model. The simulated-turn console uses client-side timers and generated representative records.

**Next work:** implement browser audio capture with `getUserMedia`, an AudioWorklet, a streaming transport, server-side session management, and a supported realtime model API.

### Operational data is only partially persistent

Supabase now persists generated voice turns and data-policy settings for user and administrator accounts. Session lifecycles, model selections, aggregate metrics, evaluations, notifications, assistant suggestions, guest-sandbox turns, and demo-account turns are still simulated or browser-local.

**Next work:** persist session lifecycle, routing events, notification state, assistant proposals, operator approvals, and resolution evidence; add a background metrics pipeline; and connect model/evaluation records to actual provider runs.

### Help Assistant is guide matching, not a generative support service

The public Help Assistant runs deterministic keyword and intent matching against the 12 maintained guides. It provides a transparent and private support experience, but it does not understand account-specific context, inspect live records, retrieve knowledge outside the page, or generate novel remediation plans.

**Next work:** if generative support is needed, move orchestration to an authenticated backend; retrieve only authorized, versioned documentation; redact sensitive inputs; cite every source; add evaluation and escalation paths; rate-limit requests; persist consented audit evidence; and keep all corrective actions behind explicit user approval.

### Account lifecycle is incomplete

Supabase Auth, self-service registration, persistent profiles, workspace membership, and demo/user/admin role gates are implemented. Password recovery, email-change UX, invitations, administrator MFA, membership management, account deletion, and session management are not yet exposed in the application.

**Next work:** add password-recovery UX, production SMTP, administrator MFA, workspace invitations, granular permissions, and auditable account deletion.

### Login throttling is process-local

The login endpoint now limits failed attempts per IP-and-email pair, but the counters live in one server process. They are not shared between instances and reset when the process restarts. Forwarded IP handling also assumes the deployment has a trusted reverse proxy.

**Next work:** move counters to a shared store, configure trusted proxy boundaries, add exponential backoff and audit events, and require multi-factor authentication for administrators.

### Privacy controls are only partly enforced

Retention, consent, acoustic-signal, and shadow-transcript settings persist in Supabase, and simulated turn records honor transcript/acoustic-signal choices. No live audio pipeline or deletion worker currently enforces raw-audio retention.

**Next work:** enforce policies on the server, attach policy versions to every turn, create deletion jobs, and produce auditable events.

### Legal pages require deployment-specific review

The Privacy Policy and Terms of Use accurately describe the current prototype, but they are structured product drafts. They do not yet identify a legal operator, privacy contact, governing law, venue, regulator, production vendors, sub-processors, storage regions, or commercial terms.

**Next work:** have qualified counsel adapt both documents to the deploying entity, jurisdictions, customers, data flows, vendors, and business model before public production use.

### Optional analytics consent is not connected to a provider

The cookie component records an analytics preference and emits a `listen-direct:consent` browser event, but no analytics library currently consumes that state. This is intentional while no analytics provider is installed.

**Next work:** if analytics are added, load them only after affirmative consent where required, document every cookie and recipient, honor later withdrawal, and verify deletion or opt-out behavior.

## Engineering issues

### Guest access must remain a page-only exception

The passwordless guest sandbox intentionally skips authentication middleware only for `/dashboard?demo=1`. It is safe because the dashboard uses seeded browser-local data and does not call protected APIs in guest mode.

**Recommended fix:** add automated regression tests proving anonymous guest rendering remains available while `/api/auth/me`, `/api/voice/turns`, `/api/data-policy`, and all administrator endpoints continue returning authorization failures. Never interpret the query parameter as server authorization.

### Dashboard page is too large

`app/pages/dashboard.vue` contains data, state, behavior, markup, and styles for every dashboard view. This is acceptable for a prototype but will become difficult to maintain.

**Recommended fix:** extract components for navigation, metrics, live console, route inspector, session explorer, model registry, evaluations, and policy controls. Move shared state into composables or a store.

### Landing-page stylesheet is compiled and minified

`app/assets/site.css` was preserved from the reference design. Its minified structure makes design changes and code review harder.

**Recommended fix:** rewrite it as organized source CSS with design tokens, component sections, and documented responsive breakpoints.

### No automated test suite

The application has been production-built and its guest/authentication boundary has been checked through rendered HTTP responses, but it has no committed unit, component, or end-to-end tests.

**Recommended fix:** add Vitest for state and utility logic, Vue Test Utils for components, and Playwright for routing and critical dashboard workflows.

### Interactive table rows should become native controls

Recent-turn table rows now expose focus, Enter, Space, and visible focus treatment, but they still rely on row-level interaction semantics.

**Recommended fix:** use a real link or button inside the first column so assistive technology receives native interactive semantics without relying on a focusable table row.

### Node.js 25 is unsupported by the selected Nuxt release

Nuxt 4.5.2 expects Node.js 22.19+, 24.11+, or 26+. The project build succeeded in the current Node.js 25 environment, but npm reports an engine warning.

**Recommended fix:** use Node.js 24 LTS locally and in CI, or Node.js 26+ when available in the deployment environment.

### Content Security Policy permits inline code and styles

The runtime CSP blocks third-party origins, framing, and plugins, but Nuxt hydration and the current component styling require `'unsafe-inline'` for scripts and styles.

**Recommended fix:** introduce per-request CSP nonces or hashes, move remaining inline styles to classes, verify hydration under the stricter policy, and then remove both inline allowances.

### Repository secret scanning is intentionally narrow

The local scanner catches private-key material, common token formats, and sensitive filenames without uploading source code. It cannot identify every vendor token or determine whether all high-entropy strings are secrets.

**Recommended fix:** enable GitHub secret scanning and push protection, extend patterns for future vendors, and keep deployment secrets in the hosting platform's secret manager.

## Commercial and operational gaps

- No metering or usage-based billing.
- Pricing cards are a preview and are not connected to checkout, subscription, entitlement, or usage enforcement.
- No API keys or SDK distribution.
- No service-level objectives, alerting, or incident process.
- No customer-facing audit export.
- No model-provider cost tracking or route-margin reporting.
- No benchmark dataset proving that direct audio outperforms transcription for target use cases.
- No production process for privacy requests, consent records, policy versioning, or legal-notice updates.
