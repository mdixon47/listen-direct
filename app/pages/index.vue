<script setup lang="ts">
type ModeName = 'standard' | 'direct'
type Stage = { name: string; detail?: string; explanation: string }

const modes: Record<ModeName, { title: string; stages: Stage[]; noteTitle: string; note: string }> = {
  direct: {
    title: 'AUDIO-NATIVE PATH',
    stages: [
      { name: 'Speech', explanation: 'The listener speaks naturally. Pitch, pace, pauses, emphasis, and energy stay inside the original audio signal.' },
      { name: 'VAD', explanation: 'Voice activity detection finds the end of the turn, so the system knows when the complete thought is ready to route.' },
      { name: 'Audio model', detail: 'Gemma 4 / Inkling', explanation: 'With --stt none, the original sound goes straight to an audio-input model. It can reason over what was said and how it was said.' },
      { name: 'TTS', explanation: 'The model’s response is streamed into text-to-speech while the system remains ready for interruptions and cancellation.' },
      { name: 'Speech', explanation: 'The listener hears the answer. The next voice turn begins without adding a transcript to the reasoning path.' },
    ],
    noteTitle: 'TRANSCRIPT BYPASSED',
    note: 'The original audio—and its pitch, cadence, emphasis, and energy—reaches the reasoning model intact.',
  },
  standard: {
    title: 'CASCADED PATH',
    stages: [
      { name: 'Speech', explanation: 'The listener speaks and the system captures the incoming audio turn.' },
      { name: 'VAD', explanation: 'Voice activity detection decides when the speaker has finished and releases the turn for processing.' },
      { name: 'STT', explanation: 'Speech-to-text converts the recording into a normalized transcript. The words remain, but vocal detail may be flattened.' },
      { name: 'LLM', explanation: 'The language model reasons over the transcript rather than the original voice signal.' },
      { name: 'TTS', explanation: 'The text response is synthesized into a voice that can be streamed back to the listener.' },
      { name: 'Speech', explanation: 'The listener hears the generated reply and the conversation returns to the capture step.' },
    ],
    noteTitle: 'TRANSCRIPT GENERATED',
    note: 'The reasoning model receives normalized text. Linguistic content survives; vocal information may not.',
  },
}

const roadmap = [
  { number: '01', category: 'RELIABILITY', title: 'Adaptive routing', copy: 'Use audio-native reasoning by default and fall back to the transcript stack only when the request calls for it.', risk: 'Not every model, language, duration, or deployment policy can safely take the direct audio path on every turn.', mechanism: 'Check model capability, policy, duration, and route health before choosing direct audio or the proven STT fallback.', proof: 'Measure fallback rate, route latency, errors, and paired response quality so richer listening never comes at the cost of reliability.', tags: ['Capability check', 'Direct first', 'Safe fallback'] },
  { number: '02', category: 'OBSERVABILITY', title: 'Shadow transcripts', copy: 'Generate an optional transcript beside the direct path for captions, debugging, and audit—without making it the model’s input.', risk: 'Audio-only incidents are difficult to search and compare, while adding a transcript to the reasoning path changes the system being measured.', mechanism: 'Create a consent-aware transcript beside the request, align it to the audio and latency trace, and keep it out of the model input.', proof: 'A side-by-side replay shows exactly where vocal meaning survived, where text flattened it, and which route produced the better response.', tags: ['Latency trace', 'Consent-aware logs', 'Side-by-side replay'] },
  { number: '03', category: 'TURN TAKING', title: 'Semantic end-of-turn', copy: 'Combine silence with intonation and meaning so the agent knows the difference between a pause and a finished thought.', risk: 'Silence-only detection cuts off reflective speakers, misses hesitation, and creates awkward dead air when thresholds are too conservative.', mechanism: 'Score silence together with pitch contour, syntax, and conversational context before releasing a completed turn to the model.', proof: 'Track false cutoffs, interruption recovery, and time to first response. Better turn detection lowers all three without making the agent impatient.', tags: ['Fewer false cuts', 'Faster first token', 'Natural backchannels'] },
  { number: '04', category: 'EVALUATION', title: 'Audio-native evals', copy: 'Benchmark direct audio against STT across pitch, pace, accents, noise, laughter, interruptions, and multilingual turns.', risk: 'Text-only tests cannot reveal when an audio model loses sarcasm, uncertainty, urgency, laughter, or meaning carried by pronunciation.', mechanism: 'Replay the same consented voice corpus through direct and cascaded paths, then score perception, response quality, latency, and safety.', proof: 'Paired results become regression gates, making model upgrades measurable instead of relying on a handful of impressive demos.', tags: ['Paired test runner', 'Perception score', 'Regression gates'] },
  { number: '05', category: 'DEVELOPER UX', title: 'Model capability registry', copy: 'Auto-negotiate codecs, sample rates, duration limits, languages, and prompt format for every audio-input model.', risk: 'Providers disagree on codecs, duration, sample rates, languages, and prompt formats, so a valid request for one model can fail on another.', mechanism: 'Resolve every request against a versioned capability registry and run a preflight check before any audio leaves the router.', proof: 'Unsupported combinations fail clearly or take a deterministic fallback, reducing provider-specific code and production surprises.', tags: ['One config surface', 'Preflight checks', 'Clear fallbacks'] },
  { number: '06', category: 'PRIVACY', title: 'Acoustic data controls', copy: 'Let developers decide whether vocal features are transient, redacted, retained, or exposed as structured signals.', risk: 'A voice can carry identity, health, emotion, location, and background context that a user may never expect the system to retain.', mechanism: 'Apply policy at capture: keep features transient, redact them, retain encrypted audio for a defined window, or expose approved signals only.', proof: 'Every turn produces a human-readable record of consent, retention, redaction, access, and deletion behavior.', tags: ['Retention policy', 'Sensitive-trait guardrails', 'Human-readable audit'] },
  { number: '07', category: 'TRUE S2S', title: 'Native audio output', copy: 'When a model supports audio generation, bypass TTS too. Preserve timing, emotion, and conversational texture end to end.', risk: 'A separate TTS layer can flatten the model’s timing and emotion, reintroduce latency, and make interruptions feel mechanical.', mechanism: 'Negotiate native audio output when supported, preserve voice continuity across turns, and fall back to TTS without changing the client protocol.', proof: 'Compare first-audio latency, interruption recovery, and listener-rated continuity against the cascaded output path.', tags: ['Audio-out adapters', 'Voice continuity', 'TTS fallback'], future: true },
]

const sequence = [
  { timing: 'NOW · 0—30 DAYS', title: 'Route + observe', copy: 'Adaptive fallback, shadow transcripts, and comparable traces.' },
  { timing: 'NEXT · 30—60 DAYS', title: 'Measure + refine', copy: 'Semantic turn detection, audio evals, and model negotiation.' },
  { timing: 'LATER · 60—90 DAYS', title: 'Go end to end', copy: 'Privacy controls, acoustic memory, and native audio output.' },
]

const pricingPlans = [
  { name: 'Explore', eyebrow: 'START HERE', price: '$0', cadence: '/ month', usage: '$0.07 / platform min', description: 'Prove the direct-listening path before you put it in front of real users.', features: ['100 platform minutes included', 'One protected workspace', 'Direct + cascaded comparison', '7-day session history'], cta: 'Start exploring', featured: false },
  { name: 'Build', eyebrow: 'SHIP WITH CONFIDENCE', price: '$59', cadence: '/ month', usage: '$0.05 / platform min', description: 'For teams routing production voice turns and measuring what each path preserves.', features: ['Three production environments', 'Shadow transcripts + traces', '30-day comparison history', 'Email implementation support'], cta: 'Start building', featured: true },
  { name: 'Scale', eyebrow: 'OPERATE AT VOLUME', price: '$299', cadence: '/ month', usage: '$0.035 / platform min', description: 'For growing voice products that need stronger controls, evaluation, and support.', features: ['Unlimited environments', 'Audio-native evaluation suite', '90-day policy + audit history', 'Priority support + volume pricing'], cta: 'Request scale access', featured: false },
]

const waveHeights = [18, 34, 58, 30, 72, 46, 84, 40, 64, 28, 52, 20, 42, 24, 16]
const currentMode = ref<ModeName>('direct')
const demoPaused = ref(false)
const pipelinePaused = ref(false)
const activeStageIndex = ref(0)
const roadmapPaused = ref(false)
const activeRoadmapIndex = ref(0)
const mode = computed(() => modes[currentMode.value])
const activeStage = computed(() => mode.value.stages[activeStageIndex.value] ?? mode.value.stages[0])
const activeRoadmap = computed(() => roadmap[activeRoadmapIndex.value] ?? roadmap[0])
let pipelineTimer: ReturnType<typeof setInterval> | undefined
let roadmapTimer: ReturnType<typeof setInterval> | undefined

function advancePipeline() {
  activeStageIndex.value = (activeStageIndex.value + 1) % mode.value.stages.length
}

function restartPipelineTimer() {
  if (pipelineTimer) clearInterval(pipelineTimer)
  pipelineTimer = setInterval(() => {
    if (!pipelinePaused.value) advancePipeline()
  }, 3200)
}

function selectMode(nextMode: ModeName) {
  currentMode.value = nextMode
  activeStageIndex.value = 0
  restartPipelineTimer()
}

function selectStage(index: number) {
  activeStageIndex.value = index
  restartPipelineTimer()
}

function advanceRoadmap() {
  activeRoadmapIndex.value = (activeRoadmapIndex.value + 1) % roadmap.length
}

function restartRoadmapTimer() {
  if (roadmapTimer) clearInterval(roadmapTimer)
  roadmapTimer = setInterval(() => {
    if (!roadmapPaused.value) advanceRoadmap()
  }, 4600)
}

function selectRoadmap(index: number) {
  activeRoadmapIndex.value = index
  restartRoadmapTimer()
}

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  pipelinePaused.value = prefersReducedMotion
  roadmapPaused.value = prefersReducedMotion
  restartPipelineTimer()
  restartRoadmapTimer()
})

onBeforeUnmount(() => {
  if (pipelineTimer) clearInterval(pipelineTimer)
  if (roadmapTimer) clearInterval(roadmapTimer)
})

useHead({
  title: 'Listen Direct',
  meta: [{ name: 'description', content: 'An interactive look at audio-native voice agents without the STT layer.' }],
  link: [{ rel: 'icon', href: '/favicon.svg' }],
})
</script>

<template>
  <main :class="{ 'demo-paused': demoPaused }">
    <nav class="nav shell" aria-label="Primary navigation">
      <a class="brand" href="#top" aria-label="Listen Direct home"><span class="brand-mark"><i /><i /><i /></span>LISTEN<span>/DIRECT</span></a>
      <div class="nav-links"><a href="#architecture">Architecture</a><a href="#roadmap">Roadmap</a><a href="#pricing">Pricing</a><NuxtLink to="/help">Help</NuxtLink></div>
      <NuxtLink class="nav-cta" to="/dashboard">Open dashboard <span>↗</span></NuxtLink>
    </nav>

    <section id="top" class="hero shell">
      <div class="eyebrow"><span /> Open voice infrastructure</div>
      <h1>The model doesn’t<br>read your voice.<br><em>It hears it.</em></h1>
      <p class="hero-copy">Make transcription optional. Send each completed voice turn straight to an audio-input model—then stream the answer back as speech.</p>
      <div class="hero-actions"><a class="primary-button" href="#architecture">See how it works <span>↓</span></a><code>--stt none</code></div>
      <div class="listen-card" aria-label="Live audio model demonstration">
        <div class="listen-meta"><span class="live"><i /> LIVE INPUT</span><span>INKLING · AUDIO NATIVE</span></div>
        <div class="listen-main">
          <button class="play" :aria-label="demoPaused ? 'Resume demo visualization' : 'Pause demo visualization'" @click="demoPaused = !demoPaused"><span /></button>
          <div class="signal" aria-hidden="true"><span v-for="height in waveHeights" :key="height" :style="{ height: `${height}%` }" /></div>
          <div class="time"><strong>02.8</strong><span>SEC</span></div>
        </div>
        <div class="listen-caption"><span>VOICE SIGNAL</span><p>“Can you tell that I’m asking this in a higher pitch?”</p><b>Pitch: elevated</b></div>
      </div>
    </section>

    <section id="architecture" class="architecture shell">
      <div class="section-kicker">01 / ARCHITECTURE</div>
      <div class="section-head"><h2>One flag. A different<br>kind of understanding.</h2><p>Choose the reliable transcript path—or let the model reason over the original sound.</p></div>
      <div class="mode-switch" role="group" aria-label="Voice pipeline mode">
        <button :class="{ active: currentMode === 'standard' }" :aria-pressed="currentMode === 'standard'" @click="selectMode('standard')"><span>Standard stack</span><small>STT enabled</small></button>
        <button :class="{ active: currentMode === 'direct' }" :aria-pressed="currentMode === 'direct'" @click="selectMode('direct')"><span>Direct listening</span><small>--stt none</small></button>
      </div>
      <div class="pipeline" :class="{ 'is-direct': currentMode === 'direct', 'is-paused': pipelinePaused }">
        <div class="pipeline-topline">
          <span>{{ mode.title }}</span>
          <button class="pipeline-control" :aria-label="pipelinePaused ? 'Play pipeline animation' : 'Pause pipeline animation'" @click="pipelinePaused = !pipelinePaused">
            <i aria-hidden="true">{{ pipelinePaused ? '▶' : 'Ⅱ' }}</i>{{ pipelinePaused ? 'PLAY' : 'AUTO' }} · {{ activeStageIndex + 1 }}/{{ mode.stages.length }}
          </button>
        </div>
        <div class="steps">
          <div v-for="(stage, index) in mode.stages" :key="`${currentMode}-${index}-${stage.name}`" class="step-wrap">
            <button
              class="step"
              :class="[`step-${index}`, { 'is-active': activeStageIndex === index, 'is-complete': activeStageIndex > index }]"
              :aria-current="activeStageIndex === index ? 'step' : undefined"
              :aria-label="`Show step ${index + 1}: ${stage.name}`"
              @click="selectStage(index)"
            >
              <small>{{ String(index + 1).padStart(2, '0') }}</small><strong>{{ stage.name }}</strong><span v-if="stage.detail">{{ stage.detail }}</span>
            </button>
            <i v-if="index < mode.stages.length - 1" class="connector" :class="{ 'is-complete': activeStageIndex > index, 'is-live': activeStageIndex === index }">→</i>
          </div>
        </div>
        <div class="pipeline-explainer">
          <div class="explainer-label"><span>HOW IT WORKS</span><b>STEP {{ String(activeStageIndex + 1).padStart(2, '0') }}</b></div>
          <Transition name="stage-copy" mode="out-in">
            <div :key="`${currentMode}-${activeStageIndex}`" class="explainer-copy">
              <strong>{{ activeStage?.name }}</strong>
              <p>{{ activeStage?.explanation }}</p>
            </div>
          </Transition>
          <button class="next-stage" @click="selectStage((activeStageIndex + 1) % mode.stages.length)">NEXT STEP <span>→</span></button>
          <div :key="`${currentMode}-${activeStageIndex}-${pipelinePaused}`" class="stage-progress" aria-hidden="true"><i /></div>
        </div>
        <div class="pipeline-note"><span>{{ mode.noteTitle }}</span><p>{{ mode.note }}</p></div>
      </div>
    </section>

    <section class="realtime-band" aria-label="Realtime capabilities"><div class="shell realtime-inner"><div><span>OPENAI REALTIME COMPATIBLE</span><strong>Same protocol. More ways to listen.</strong></div><ul><li><i /> Streaming</li><li><i /> Cancellation</li><li><i /> Barge-in</li></ul></div></section>

    <section id="roadmap" class="roadmap shell">
      <div class="section-kicker">02 / WHAT'S NEXT</div>
      <div class="section-head roadmap-head"><h2>Build the trust layer<br>around the magic.</h2><p>The strongest next move is not another demo. It is making direct listening observable, comparable, and safe to deploy.</p></div>
      <div class="roadmap-walkthrough" :class="{ 'is-paused': roadmapPaused }">
        <div class="roadmap-walkthrough-topline">
          <span>TRUST LAYER WALKTHROUGH</span>
          <button :aria-label="roadmapPaused ? 'Play trust layer animation' : 'Pause trust layer animation'" @click="roadmapPaused = !roadmapPaused"><i aria-hidden="true">{{ roadmapPaused ? '▶' : 'Ⅱ' }}</i>{{ roadmapPaused ? 'PLAY' : 'AUTO' }} · {{ activeRoadmapIndex + 1 }}/{{ roadmap.length }}</button>
        </div>
        <div class="trust-selector" role="group" aria-label="Trust layer capability">
          <button v-for="(item, index) in roadmap" :key="item.number" :class="{ 'is-active': activeRoadmapIndex === index }" :aria-pressed="activeRoadmapIndex === index" @click="selectRoadmap(index)">
            <span>{{ item.number }} · {{ item.category }}</span><strong>{{ item.title }}</strong>
          </button>
        </div>
        <Transition name="trust-story" mode="out-in">
          <div :key="activeRoadmap?.number" class="roadmap-story">
            <div class="story-number">{{ activeRoadmap?.number }}</div>
            <div class="story-intro"><span>{{ activeRoadmap?.category }}</span><h3>{{ activeRoadmap?.title }}</h3><p>{{ activeRoadmap?.copy }}</p><ul><li v-for="tag in activeRoadmap?.tags" :key="tag">{{ tag }}</li></ul></div>
            <div class="story-details">
              <div><span>01 / THE RISK</span><p>{{ activeRoadmap?.risk }}</p></div>
              <div><span>02 / THE MECHANISM</span><p>{{ activeRoadmap?.mechanism }}</p></div>
              <div><span>03 / PROOF IT WORKS</span><p>{{ activeRoadmap?.proof }}</p></div>
            </div>
          </div>
        </Transition>
        <div :key="`${activeRoadmapIndex}-${roadmapPaused}`" class="roadmap-progress" aria-hidden="true"><i /></div>
      </div>
    </section>

    <section class="build-order shell"><div class="section-kicker">03 / RECOMMENDED SEQUENCE</div><div class="order-grid"><div v-for="item in sequence" :key="item.timing"><span>{{ item.timing }}</span><strong>{{ item.title }}</strong><p>{{ item.copy }}</p></div></div></section>
    <section id="pricing" class="pricing shell">
      <div class="section-kicker">04 / EARLY ACCESS PRICING</div>
      <div class="section-head pricing-head"><h2>Start small.<br>Pay as you listen.</h2><p>A predictable platform fee for routing, policy, and observability. Bring your own model providers or pay their usage at cost.</p></div>
      <div class="pricing-grid">
        <article v-for="plan in pricingPlans" :key="plan.name" class="pricing-card" :class="{ featured: plan.featured }">
          <div class="pricing-meta"><span>{{ plan.eyebrow }}</span><b v-if="plan.featured">MOST POPULAR</b></div>
          <h3>{{ plan.name }}</h3>
          <div class="plan-price"><strong>{{ plan.price }}</strong><span>{{ plan.cadence }}</span></div>
          <p>{{ plan.description }}</p>
          <div class="usage-rate"><span>PLATFORM USAGE</span><strong>{{ plan.usage }}</strong></div>
          <ul><li v-for="feature in plan.features" :key="feature"><i>✓</i>{{ feature }}</li></ul>
          <NuxtLink :class="{ primary: plan.featured }" :to="`/login?mode=signup&plan=${plan.name.toLowerCase()}`">{{ plan.cta }} <span>→</span></NuxtLink>
        </article>
      </div>
      <p class="pricing-note"><span>PRICING NOTE</span> Model inference, speech synthesis, transcription, and telephony are separate provider costs. Bring your own keys or use transparent pass-through billing. Early-access rates may change before general availability.</p>
    </section>

    <section class="closing-cta">
      <div class="shell closing-cta-inner">
        <div><span>READY TO LISTEN DIRECT?</span><h2>Keep the voice.<br><em>Lose the translation layer.</em></h2></div>
        <div class="closing-cta-copy"><p>Open a protected workspace, compare both paths, and decide where direct listening earns its place.</p><div><NuxtLink class="primary-button" to="/login?mode=signup">Start free <span>→</span></NuxtLink><NuxtLink class="secondary-button" to="/dashboard">Open dashboard ↗</NuxtLink></div></div>
      </div>
    </section>
    <footer class="footer shell"><a class="brand" href="#top"><span class="brand-mark"><i /><i /><i /></span>LISTEN<span>/DIRECT</span></a><p>Speech should carry more than words.</p><div class="footer-legal"><NuxtLink to="/help">HELP</NuxtLink><NuxtLink to="/privacy">PRIVACY</NuxtLink><NuxtLink to="/terms">TERMS</NuxtLink></div><a href="#top">BACK TO TOP ↑</a></footer>
  </main>
</template>
