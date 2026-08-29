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

### Resolved in the 2026-08-29 engineering pass

The following repository issues now have committed implementation fixes and automated gates:

- The guest exception is isolated in a testable helper, and the production-server integration test proves that protected read and write APIs still reject anonymous callers.
- Unit and integration tests run locally and in CI.
- Recent-turn interaction uses a native button instead of a focusable table row.
- `.nvmrc` pins the supported Node.js 24.11 runtime used by CI.
- Landing and dashboard CSS are readable source files guarded by a pinned Prettier check.
- Dashboard styles and static representative data are no longer embedded in the page component.
- Secret scanning covers additional vendor-token formats while retaining filename and private-key checks.
- Protected write endpoints authenticate callers before validating request bodies.

### Dashboard view is still broad

`app/pages/dashboard.vue` no longer contains its styles or static representative datasets, but it still owns state, behavior, and markup for every dashboard view.

**Next work:** extract navigation, metrics, live console, route inspector, session explorer, notification center, model registry, evaluations, and policy controls into focused components. Move shared dashboard behavior into composables or a store, then add component-level interaction tests.

### Content Security Policy permits inline code and styles

The runtime CSP blocks third-party origins, framing, and plugins, but Nuxt hydration and the current component styling require `'unsafe-inline'` for scripts and styles.

**Recommended fix:** introduce per-request CSP nonces or hashes, move remaining inline styles to classes, verify hydration under the stricter policy, and then remove both inline allowances.

### Repository secret scanning remains heuristic

The local scanner catches private-key material, sensitive filenames, and common AWS, GitHub, OpenAI, npm, Slack, Stripe, Supabase, SendGrid, Google, Twilio, and Netlify token formats without uploading source code. It cannot identify every vendor token or determine whether all high-entropy strings are secrets.

**Next work:** enable GitHub secret scanning and push protection, add patterns when new vendors are adopted, and keep deployment secrets in the hosting platform's secret manager.

## Commercial and operational gaps

- No metering or usage-based billing.
- Pricing cards are a preview and are not connected to checkout, subscription, entitlement, or usage enforcement.
- No API keys or SDK distribution.
- No service-level objectives, alerting, or incident process.
- No customer-facing audit export.
- No model-provider cost tracking or route-margin reporting.
- No benchmark dataset proving that direct audio outperforms transcription for target use cases.
- No production process for privacy requests, consent records, policy versioning, or legal-notice updates.
