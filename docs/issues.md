# Issues and Gaps

This file tracks known limitations and the work required to turn the current product demo into a production service.

## Critical product gaps

### Live audio is simulated

The dashboard does not currently capture microphone input, run voice-activity detection, stream audio, or call an audio-capable model. The live-turn console uses client-side timers and generated demo records.

**Next work:** implement browser audio capture with `getUserMedia`, an AudioWorklet, a streaming transport, server-side session management, and a supported realtime model API.

### Operational data has no persistence

Sessions, policies, model selections, and metrics exist only in browser memory and reset on refresh.

**Next work:** add a database, durable session/event storage, protected mutation APIs, and a background metrics pipeline.

### Authentication uses development identities

Authentication, sealed sessions, and demo/user/admin role gates are implemented. The three identities are static development fixtures, however, and there is no self-service registration, password recovery, account lifecycle, or durable identity store.

**Next work:** replace fixture accounts with a database or external identity provider, add workspace membership, and define granular permissions beyond the current role checks.

### Login throttling is process-local

The login endpoint now limits failed attempts per IP-and-email pair, but the counters live in one server process. They are not shared between instances and reset when the process restarts. Forwarded IP handling also assumes the deployment has a trusted reverse proxy.

**Next work:** move counters to a shared store, configure trusted proxy boundaries, add exponential backoff and audit events, and require multi-factor authentication for administrators.

### Privacy controls are not enforced

Retention, consent, acoustic-signal, and shadow-transcript settings currently update the UI only. They do not control real storage or processing behavior.

**Next work:** enforce policies on the server, attach policy versions to every turn, create deletion jobs, and produce auditable events.

### Legal pages require deployment-specific review

The Privacy Policy and Terms of Use accurately describe the current prototype, but they are structured product drafts. They do not yet identify a legal operator, privacy contact, governing law, venue, regulator, production vendors, sub-processors, storage regions, or commercial terms.

**Next work:** have qualified counsel adapt both documents to the deploying entity, jurisdictions, customers, data flows, vendors, and business model before public production use.

### Optional analytics consent is not connected to a provider

The cookie component records an analytics preference and emits a `listen-direct:consent` browser event, but no analytics library currently consumes that state. This is intentional while no analytics provider is installed.

**Next work:** if analytics are added, load them only after affirmative consent where required, document every cookie and recipient, honor later withdrawal, and verify deletion or opt-out behavior.

## Engineering issues

### Dashboard page is too large

`app/pages/dashboard.vue` contains data, state, behavior, markup, and styles for every dashboard view. This is acceptable for a prototype but will become difficult to maintain.

**Recommended fix:** extract components for navigation, metrics, live console, route inspector, session explorer, model registry, evaluations, and policy controls. Move shared state into composables or a store.

### Landing-page stylesheet is compiled and minified

`app/assets/site.css` was preserved from the reference design. Its minified structure makes design changes and code review harder.

**Recommended fix:** rewrite it as organized source CSS with design tokens, component sections, and documented responsive breakpoints.

### No automated test suite

The application has been production-built and manually browser-tested, but it has no committed unit, component, or end-to-end tests.

**Recommended fix:** add Vitest for state and utility logic, Vue Test Utils for components, and Playwright for routing and critical dashboard workflows.

### Interactive table rows are mouse-oriented

Recent-turn table rows use click handlers but are not keyboard-focusable controls.

**Recommended fix:** use links or buttons inside the first column, or add appropriate keyboard behavior and focus styling.

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
- No API keys or SDK distribution.
- No service-level objectives, alerting, or incident process.
- No customer-facing audit export.
- No model-provider cost tracking or route-margin reporting.
- No benchmark dataset proving that direct audio outperforms transcription for target use cases.
- No production process for privacy requests, consent records, policy versioning, or legal-notice updates.
