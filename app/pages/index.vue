<script setup lang="ts">
type ModeName = 'standard' | 'direct'
type Stage = { name: string; detail?: string }

const modes: Record<ModeName, { title: string; stages: Stage[]; noteTitle: string; note: string }> = {
  direct: {
    title: 'AUDIO-NATIVE PATH',
    stages: [
      { name: 'Speech' },
      { name: 'VAD' },
      { name: 'Audio model', detail: 'Gemma 4 / Inkling' },
      { name: 'TTS' },
      { name: 'Speech' },
    ],
    noteTitle: 'TRANSCRIPT BYPASSED',
    note: 'The original audio—and its pitch, cadence, emphasis, and energy—reaches the reasoning model intact.',
  },
  standard: {
    title: 'CASCADED PATH',
    stages: [
      { name: 'Speech' },
      { name: 'VAD' },
      { name: 'STT' },
      { name: 'LLM' },
      { name: 'TTS' },
      { name: 'Speech' },
    ],
    noteTitle: 'TRANSCRIPT GENERATED',
    note: 'The reasoning model receives normalized text. Linguistic content survives; vocal information may not.',
  },
}

const roadmap = [
  { number: '02', category: 'OBSERVABILITY', title: 'Shadow transcripts', copy: 'Generate an optional transcript beside the direct path for captions, debugging, and audit—without making it the model’s input.', tags: ['Latency trace', 'Consent-aware logs', 'Side-by-side replay'] },
  { number: '03', category: 'TURN TAKING', title: 'Semantic end-of-turn', copy: 'Combine silence with intonation and meaning so the agent knows the difference between a pause and a finished thought.', tags: ['Fewer false cuts', 'Faster first token', 'Natural backchannels'] },
  { number: '04', category: 'EVALUATION', title: 'Audio-native evals', copy: 'Benchmark direct audio against STT across pitch, pace, accents, noise, laughter, interruptions, and multilingual turns.', tags: ['Paired test runner', 'Perception score', 'Regression gates'] },
  { number: '05', category: 'DEVELOPER UX', title: 'Model capability registry', copy: 'Auto-negotiate codecs, sample rates, duration limits, languages, and prompt format for every audio-input model.', tags: ['One config surface', 'Preflight checks', 'Clear fallbacks'] },
  { number: '06', category: 'PRIVACY', title: 'Acoustic data controls', copy: 'Let developers decide whether vocal features are transient, redacted, retained, or exposed as structured signals.', tags: ['Retention policy', 'Sensitive-trait guardrails', 'Human-readable audit'] },
  { number: '07', category: 'TRUE S2S', title: 'Native audio output', copy: 'When a model supports audio generation, bypass TTS too. Preserve timing, emotion, and conversational texture end to end.', tags: ['Audio-out adapters', 'Voice continuity', 'TTS fallback'], future: true },
]

const sequence = [
  { timing: 'NOW · 0—30 DAYS', title: 'Route + observe', copy: 'Adaptive fallback, shadow transcripts, and comparable traces.' },
  { timing: 'NEXT · 30—60 DAYS', title: 'Measure + refine', copy: 'Semantic turn detection, audio evals, and model negotiation.' },
  { timing: 'LATER · 60—90 DAYS', title: 'Go end to end', copy: 'Privacy controls, acoustic memory, and native audio output.' },
]

const waveHeights = [18, 34, 58, 30, 72, 46, 84, 40, 64, 28, 52, 20, 42, 24, 16]
const currentMode = ref<ModeName>('direct')
const demoPaused = ref(false)
const mode = computed(() => modes[currentMode.value])

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
      <div class="nav-links"><a href="#architecture">Architecture</a><a href="#roadmap">Roadmap</a></div>
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
        <button :class="{ active: currentMode === 'standard' }" :aria-pressed="currentMode === 'standard'" @click="currentMode = 'standard'"><span>Standard stack</span><small>STT enabled</small></button>
        <button :class="{ active: currentMode === 'direct' }" :aria-pressed="currentMode === 'direct'" @click="currentMode = 'direct'"><span>Direct listening</span><small>--stt none</small></button>
      </div>
      <div class="pipeline" :class="{ 'is-direct': currentMode === 'direct' }">
        <div class="pipeline-topline"><span>{{ mode.title }}</span><span>{{ mode.stages.length }} STAGES</span></div>
        <div class="steps">
          <div v-for="(stage, index) in mode.stages" :key="`${currentMode}-${stage.name}`" class="step-wrap">
            <div class="step" :class="`step-${index}`"><small>{{ String(index + 1).padStart(2, '0') }}</small><strong>{{ stage.name }}</strong><span v-if="stage.detail">{{ stage.detail }}</span></div>
            <i v-if="index < mode.stages.length - 1" class="connector">→</i>
          </div>
        </div>
        <div class="pipeline-note"><span>{{ mode.noteTitle }}</span><p>{{ mode.note }}</p></div>
      </div>
    </section>

    <section class="realtime-band" aria-label="Realtime capabilities"><div class="shell realtime-inner"><div><span>OPENAI REALTIME COMPATIBLE</span><strong>Same protocol. More ways to listen.</strong></div><ul><li><i /> Streaming</li><li><i /> Cancellation</li><li><i /> Barge-in</li></ul></div></section>

    <section id="roadmap" class="roadmap shell">
      <div class="section-kicker">02 / WHAT'S NEXT</div>
      <div class="section-head roadmap-head"><h2>Build the trust layer<br>around the magic.</h2><p>The strongest next move is not another demo. It is making direct listening observable, comparable, and safe to deploy.</p></div>
      <article class="priority-card">
        <div class="priority-rank">NEXT<br><strong>01</strong></div>
        <div class="priority-copy"><span>SHIP FIRST · RELIABILITY</span><h3>Adaptive dual-path routing</h3><p>Run audio-native by default, fall back to STT when a model, language, duration, or confidence threshold calls for it. Teams get the richer path without losing operational reliability.</p></div>
        <div class="priority-flow" aria-label="Adaptive route example"><div><span>VOICE TURN</span><b>audio.wav</b></div><i>→</i><div class="decision"><span>ROUTER</span><b>direct?</b></div><i>↗</i><div><span>PRIMARY</span><b>Audio model</b></div><i>↘</i><div><span>FALLBACK</span><b>STT + LLM</b></div></div>
      </article>
      <div class="roadmap-grid">
        <article v-for="item in roadmap" :key="item.number" class="roadmap-card" :class="{ 'future-card': item.future }">
          <div class="card-meta"><span>{{ item.number }}</span><b>{{ item.category }}</b></div><h3>{{ item.title }}</h3><p>{{ item.copy }}</p><ul><li v-for="tag in item.tags" :key="tag">{{ tag }}</li></ul>
        </article>
      </div>
    </section>

    <section class="build-order shell"><div class="section-kicker">03 / RECOMMENDED SEQUENCE</div><div class="order-grid"><div v-for="item in sequence" :key="item.timing"><span>{{ item.timing }}</span><strong>{{ item.title }}</strong><p>{{ item.copy }}</p></div></div></section>
    <footer class="footer shell"><a class="brand" href="#top"><span class="brand-mark"><i /><i /><i /></span>LISTEN<span>/DIRECT</span></a><p>Speech should carry more than words.</p><div class="footer-legal"><NuxtLink to="/privacy">PRIVACY</NuxtLink><NuxtLink to="/terms">TERMS</NuxtLink></div><a href="#top">BACK TO TOP ↑</a></footer>
  </main>
</template>
