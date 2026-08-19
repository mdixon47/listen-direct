# What We Learned

## Product lessons

### The valuable product is the reliability layer

Raw access to an audio-capable model is not enough for production teams. The defensible product is the infrastructure around it: routing, fallbacks, observability, evaluation, privacy controls, and model compatibility.

### Direct audio and transcription serve different purposes

Direct audio preserves pitch, cadence, emphasis, energy, laughter, and interruption behavior. Transcription remains useful for captions, search, audits, and debugging. A strong architecture keeps the transcript beside the reasoning path instead of forcing every request through it.

### Adaptive routing is a better default than ideology

Some turns should go directly to an audio model; others should fall back because of model support, language, duration, noise, latency, or confidence. Customers are more likely to pay for predictable outcomes than for a strict “never transcribe” promise.

### Trust requires evidence

The dashboard needs to answer four questions for every voice turn:

1. Which route was selected?
2. Why was it selected?
3. What did it cost in time and money?
4. What audio, transcript, and derived signals were retained?

### Consent must be a real, reversible choice

A banner is not enough by itself. Optional processing should begin disabled, accepting and declining should both be clear, and the choice must remain easy to revisit. Essential session cookies belong in a separate category because disabling them would prevent authentication and security controls from working.

### Legal copy must match the running product

The safest prototype language is concrete: the current dashboard simulates audio, no analytics provider is connected, sessions expire, and production vendors are not yet selected. Policies should be updated alongside the actual data flow rather than describing planned safeguards as if they already exist.

### The initial customer should be a developer team

The current concept is strongest as infrastructure for teams already building voice products. A focused SDK and API can solve integration and reliability problems without competing directly as another general-purpose assistant.

## Technical lessons

### Separate the landing experience from product operations

The landing page explains the thesis; the dashboard demonstrates the operational product. Nuxt file-based routes make that distinction explicit while keeping one visual system and deployment.

### A client-side simulation is useful for product validation

The simulated live turn makes workflows testable before choosing an audio provider or backend architecture. It allows product decisions about routing, session review, evaluations, and policies to happen before expensive infrastructure work.

### The production data model should be event-based

A voice turn changes through capture, routing, model processing, response streaming, interruption, completion, and retention. An append-only event stream would preserve timing and policy decisions more reliably than a single mutable session record.

Suggested core entities:

- Workspace
- Environment
- Voice session
- Voice turn
- Route decision
- Model invocation
- Audio artifact
- Shadow transcript
- Evaluation result
- Policy version
- Usage event

### Policy must travel with the turn

Retention and consent cannot be dashboard-only settings. The server should snapshot the active policy onto every turn so later audits can prove which rules applied when the audio was processed.

### Authentication and authorization are separate controls

A sealed session proves who is making a request; it does not prove that the person may perform every action. Page middleware improves navigation, while each sensitive server endpoint must independently enforce its required role or permission.

The current implementation therefore protects the admin page in the client and protects the admin directory again on the server.

### Model capabilities should be data, not conditionals

Codecs, sample rates, streaming support, duration limits, languages, and output modes belong in a registry. Routing can then evaluate capabilities and constraints without accumulating provider-specific branches throughout the codebase.

## Next hypotheses to validate

1. Teams will pay first for adaptive routing and observability, before native audio output.
2. Shadow transcripts can satisfy debugging and compliance needs without becoming the model input.
3. A paired evaluation runner can demonstrate meaningful gains for tone-sensitive use cases.
4. Usage pricing should combine a platform fee with processed audio minutes and premium observability retention.
5. The best initial vertical will have high voice volume and clear value from vocal information, such as coaching, customer support, or language learning.
