# Listen Direct Help and How-Tos

This document mirrors the public `/help` experience and gives maintainers a durable operational reference. It describes the current demonstration accurately and separates implemented behavior from production recommendations.

## Current demo scope

- The dashboard does not request microphone access or transmit audio to an AI provider.
- Starting a live turn animates the interface and creates representative turn metadata.
- Demo-role turns remain in browser memory and disappear on refresh.
- Registered user and administrator accounts persist generated turn metadata and data-policy settings in Supabase.
- The product uses Supabase authentication, server-side authorization checks, and PostgreSQL row-level security.

## Roles

| Role | Intended use | Persistence | Key restrictions |
| --- | --- | --- | --- |
| Demo | Explore the product safely | Browser session only | Data policies are read-only |
| User | Operate a workspace | Supabase | Cannot administer identities |
| Admin | Operate and manage access | Supabase | Should use least privilege and MFA in production |

## How to run a simulated voice turn

1. Sign in and open **Dashboard → Live overview**.
2. Choose **Adaptive**, **Direct**, or **Standard** in Active route.
3. Select **Start live turn** and let the waveform run for a few seconds.
4. Select **End turn** and wait for processing to complete.
5. Select the new row under Recent voice turns to inspect it in Sessions.

Expected result: the turn shows its route, model, latency, duration, acoustic-signal label, completion status, and optional shadow transcript.

## How to choose a routing mode

### Adaptive

Use Adaptive as the normal deployment model. It represents a route gate that prefers direct audio when capability and confidence are sufficient and falls back when they are not.

### Direct

Use Direct for controlled tests where pitch, cadence, emphasis, energy, laughter, hesitation, or turn-taking may change the meaning. The selected Model registry entry becomes the representative primary model.

### Standard

Use Standard as the cascaded STT + LLM baseline. It is useful for reliability comparisons, unsupported audio conditions, and workflows where text is the required system of record.

## How to investigate a slow or fallback turn

1. Open **Sessions** or select a Recent voice turns row.
2. Search by turn ID. Model, route, signal, and status are also searchable.
3. Read route, model, duration, latency, signal, and status together.
4. Decide whether the fallback was intentional, capability-driven, or unexpected.
5. Review Session health and P95 latency to determine whether the problem is isolated.
6. Reproduce the condition through Direct and Standard, then compare it in Audio evals.

Do not treat every fallback as a failure. A reliable fallback is an expected safety and compatibility mechanism.

## How to select a primary model

1. Open **Model registry**.
2. Confirm codec and streaming compatibility.
3. Compare perception score and median latency.
4. Select the desired card to make it the representative primary model.
5. Keep a compatible secondary or fallback model available.

Production routing should evaluate codec, sample rate, language, duration, availability, latency, policy, and confidence before invoking a provider.

## How to compare Direct and Standard

1. Choose one signal-specific evaluation suite.
2. Replay the same consented source condition through both paths.
3. Keep prompts, model versions, output settings, and scoring criteria stable.
4. Review score, paired-run count, latency, safety, and fallback recovery.
5. Promote a direct route only when its advantage is repeatable and operationally acceptable.

The current dashboard presents representative evaluation data; a production runner still needs to be connected.

## How to configure the data policy

Open **Dashboard → Data controls** and review:

- **Shadow transcripts:** creates optional text beside the direct path.
- **Consent-aware logging:** requires a valid consent state before storing traces.
- **Acoustic signals:** exposes approved features such as pitch, energy, cadence, and turn-taking.
- **Raw audio retention:** supports Transient only, 1 hour, 24 hours, or 7 days.

Use the shortest retention window that satisfies a documented operational need. Registered users can select **Save policy**; the demo role cannot persist policy changes.

## How to review access as an administrator

1. Sign in with an administrator account.
2. Open **Administration** from the dashboard sidebar.
3. Review each identity’s role, workspace, status, and recent activity.
4. Use the role matrix to confirm least privilege.
5. Investigate unexpected administrators or audit events immediately.

Production administration should add MFA, durable audit retention, alerting, access reviews, and an incident-response process.

## Troubleshooting sign-in

1. Confirm that the chosen account type matches the account.
2. Sign out and establish a fresh session.
3. Allow essential site cookies and storage.
4. For deployments, verify `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the hosting environment.
5. Never expose a Supabase secret or service-role key to the browser.
6. If authentication works but a route is denied, verify the profile role and workspace membership.

## Troubleshooting missing turns or policies

- Demo turns disappearing after refresh is expected.
- Demo policy changes are exploratory and cannot be saved.
- Registered persistence failures appear above the dashboard content.
- Policy failures change the status to **Unable to save policy**.
- Confirm the Supabase migrations, authenticated workspace, membership row, and RLS policies.
- Retry one small operation after fixing configuration.

Do not disable RLS to make a failing query pass. Correct the identity, membership, or policy instead.

## Production-readiness checklist

- [ ] Connect providers through a capability adapter.
- [ ] Capture informed, reversible consent before audio collection.
- [ ] Persist the route reason, timings, model invocation, consent state, and policy snapshot per turn.
- [ ] Test direct and fallback paths with paired audio-native evaluations.
- [ ] Add rate limiting, monitoring, backups, deletion workflows, and incident response.
- [ ] Require MFA and least privilege for administrators.
- [ ] Document vendors, regions, retention, pricing, and customer responsibilities.
- [ ] Obtain security, privacy, accessibility, and legal review before launch.

## Glossary

- **Direct:** audio goes to an audio-input model without transcription as the reasoning input.
- **Standard:** speech-to-text, text reasoning, then speech synthesis.
- **Adaptive:** a route gate chooses Direct or Standard using capability, confidence, latency, and policy.
- **Shadow transcript:** optional text generated beside the direct path.
- **Acoustic signals:** approved non-text features such as pitch, energy, cadence, and turn-taking.
- **RLS:** PostgreSQL row-level security that enforces workspace access at the data layer.

## Related documents

- `README.md` — product overview and local setup
- `docs/learn.md` — product and technical lessons
- `docs/issues.md` — known limitations and risks
- `docs/devsecops.md` — security and delivery practices
- `/privacy` — current data-handling disclosure
- `/terms` — current demo terms
