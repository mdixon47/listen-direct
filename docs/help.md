# Listen Direct Help and How-Tos

This document mirrors the public `/help` experience and gives maintainers a durable operational reference. It describes the current demonstration accurately and separates implemented behavior from production recommendations.

## Current demo scope

- The dashboard does not request microphone access or transmit audio to an AI provider.
- Starting a simulated turn animates the interface and creates representative turn metadata.
- `/dashboard?demo=1` opens an instant guest sandbox without an account or access to protected APIs.
- The guest sandbox begins with a three-step guided tour and seeded representative turns.
- Guest and demo-account turns remain in browser memory and disappear on refresh.
- Registered user and administrator accounts persist generated turn metadata and data-policy settings in Supabase.
- The product uses Supabase authentication, server-side authorization checks, and PostgreSQL row-level security.

## How to use the AI Help Assistant

Open `/help#help-assistant` to ask a task, feature, or troubleshooting question in plain language. The assistant is designed to shorten the path from a symptom to a maintained procedure while keeping the full guide library available for deeper review.

1. Describe what you are trying to do or the symptom you see. Include the relevant role, dashboard area, route, or status when known.
2. Use a suggested question when you want a quick starting point for fallbacks, notifications, policy persistence, demo safety, or production readiness.
3. Review the match-strength label and the recommended guide. The answer names the guide that supplied its guidance.
4. Follow the first three documented actions shown in the response.
5. Select **Open full guide** to review every step, success check, and related control.
6. Use the related application link only after confirming that it matches your intended task.
7. Select **Clear session** to remove the current browser-only conversation.

The assistant can help with:

- Getting started and understanding the honest demo boundary
- Choosing routes and investigating slow or fallback turns
- Reviewing AI-assisted notifications with human approval
- Selecting models and comparing Direct with Standard
- Configuring privacy, retention, consent, and acoustic-signal controls
- Resolving sign-in, role, persistence, and RLS problems
- Building a production-readiness checklist

### Assistant privacy and accuracy boundary

The current Help Assistant is a deterministic, browser-local matching experience—not a connected generative model. It scores the question against the 12 maintained guides, returns the strongest documented match, and keeps at most the three most recent answers in page memory. It does not send questions to an external AI provider, execute changes, inspect private workspace records, or persist the conversation.

Do not enter passwords, API keys, authentication tokens, customer audio, transcripts, or personal data. Treat **Best available match** as a prompt to rephrase the question or read the full guide. The dashboard notification assistant is a separate representative workflow and still requires explicit operator approval before applying a simulated correction.

## Access modes and roles

| Access | Intended use | Persistence | Key restrictions |
| --- | --- | --- | --- |
| Guest sandbox | Explore instantly without signing in | Browser session only | Protected APIs and workspace data are unavailable |
| Demo account | Explore through a shared authenticated identity | Browser session only | Data policies are read-only |
| User | Operate a workspace | Supabase | Cannot administer identities |
| Admin | Operate and manage access | Supabase | Should use least privilege and MFA in production |

Use the guest sandbox for the fastest product tour. Use the shared demo account when authentication itself is part of the walkthrough. Create a user or administrator account only when you need protected workspace persistence.

## How to run a simulated voice turn

1. Choose **Try instant demo** on the product page, or open `/dashboard?demo=1`.
2. Follow **Guided start** to select Direct, generate a sample turn, and inspect the result.
3. For a manual run, choose **Adaptive**, **Direct**, or **Standard** in Active route.
4. Select **Start simulated turn** and let the waveform run for a few seconds.
5. Select **End turn** and wait for processing to complete.
6. Select the new row under Recent voice turns to inspect it in Sessions.

Expected result: the browser-only turn shows its representative route, model, latency, duration, acoustic-signal label, completion status, and optional shadow transcript. It disappears when the guest sandbox closes.

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

## How to review and correct a notification

1. Open **Notifications** from the dashboard sidebar or select the header badge.
   You can also open `/dashboard?demo=1&view=notifications` for a direct guest-sandbox preview.
2. Filter the inbox by **Open**, **Needs assistance**, **Resolved**, or **All**.
3. Select a notice and review its severity, source, category, time, related turn, and status.
4. If the notice offers assistance, select **Ask AI assistant**.
5. Review the representative diagnosis, correction plan, and exact suggested change.
6. Select **Approve and apply correction** only when the suggestion matches your intent, or choose **Mark resolved manually** without applying a change.
7. Reopen a resolved notice when more investigation is required.

The current assistant is a local product simulation and does not call an external AI provider. Corrections update representative dashboard state only. A production implementation must authenticate every action, enforce workspace authorization, validate policy constraints, and write durable audit evidence.

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
4. For deployments, verify `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY` in the hosting environment.
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
- [ ] Keep guest access limited to the browser-only dashboard simulation; never use the `demo=1` query as server authorization.
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

- [`README.md`](../README.md) — product overview and local setup
- [`docs/learn.md`](learn.md) — product and technical lessons
- [`docs/issues.md`](issues.md) — known limitations and risks
- [`docs/devsecops.md`](devsecops.md) — security and delivery practices
- [`SECURITY.md`](../SECURITY.md) — private vulnerability reporting
- `/privacy` — current data-handling disclosure
- `/terms` — current demo terms
