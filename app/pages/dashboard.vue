<script setup lang="ts">
definePageMeta({ middleware: 'authenticated' })

type ViewName = 'overview' | 'sessions' | 'models' | 'evals' | 'controls'
type RouteMode = 'adaptive' | 'direct' | 'standard'

type Turn = {
  id: string
  time: string
  duration: string
  route: 'Direct' | 'Fallback'
  model: string
  latency: string
  signal: string
  status: 'Complete' | 'Flagged'
  transcript: string
}

type AppUser = {
  id: string
  name: string
  email: string
  role: 'demo' | 'user' | 'admin'
  workspace: string
  organizationId: string
}

type DataPolicy = {
  shadow_transcripts: boolean
  consent_logging: boolean
  acoustic_signals: boolean
  raw_audio_retention_hours: number
  version: number
  updated_at: string
}

const navigation: { id: ViewName; label: string; hint: string }[] = [
  { id: 'overview', label: 'Live overview', hint: '01' },
  { id: 'sessions', label: 'Sessions', hint: '02' },
  { id: 'models', label: 'Model registry', hint: '03' },
  { id: 'evals', label: 'Audio evals', hint: '04' },
  { id: 'controls', label: 'Data controls', hint: '05' },
]

const models = [
  { name: 'Inkling Audio', provider: 'Primary', latency: '482 ms', quality: 96, codecs: 'PCM16 · Opus', status: 'Ready' },
  { name: 'Gemma 4 Audio', provider: 'Secondary', latency: '618 ms', quality: 92, codecs: 'PCM16 · WAV', status: 'Ready' },
  { name: 'Realtime Voice', provider: 'Fallback', latency: '744 ms', quality: 89, codecs: 'PCM16 · μ-law', status: 'Ready' },
]

const evaluationSuites = [
  { title: 'Pitch + emphasis', score: 94, runs: 240, change: '+2.4%' },
  { title: 'Accents + dialects', score: 88, runs: 380, change: '+1.1%' },
  { title: 'Noise resilience', score: 91, runs: 192, change: '+4.8%' },
  { title: 'Turn boundaries', score: 97, runs: 516, change: '+0.6%' },
]

const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { data: identity } = await useFetch<{ user: AppUser }>('/api/auth/me', { headers: requestHeaders })
const { data: persistedTurns } = await useFetch<{ turns: Turn[] }>('/api/voice/turns', { headers: requestHeaders })
const { data: persistedPolicy } = await useFetch<{ policy: DataPolicy }>('/api/data-policy', { headers: requestHeaders })

const recentTurns = ref<Turn[]>(persistedTurns.value?.turns ?? [])

const activeView = ref<ViewName>('overview')
const user = computed(() => identity.value?.user)
const routeMode = ref<RouteMode>('adaptive')
const selectedModel = ref('Inkling Audio')
const shadowTranscripts = ref(persistedPolicy.value?.policy.shadow_transcripts ?? true)
const consentLogging = ref(persistedPolicy.value?.policy.consent_logging ?? true)
const acousticSignals = ref(persistedPolicy.value?.policy.acoustic_signals ?? true)
const retention = ref(({ 0: 'Transient only', 1: '1 hour', 24: '24 hours', 168: '7 days' } as Record<number, string>)[persistedPolicy.value?.policy.raw_audio_retention_hours ?? 24] ?? '24 hours')
const policySaving = ref(false)
const policyStatus = ref('Policies active')
const turnError = ref('')
const recording = ref(false)
const processing = ref(false)
const elapsedTenths = ref(0)
const waveLevels = ref([22, 36, 64, 42, 76, 52, 88, 46, 70, 34, 58, 28, 48, 32, 20, 40, 62, 82, 54, 30, 68, 44, 24, 38])
const search = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const pageTitle = computed(() => navigation.find(item => item.id === activeView.value)?.label ?? 'Live overview')
const visibleTurns = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return recentTurns.value
  return recentTurns.value.filter(turn => Object.values(turn).some(value => value.toLowerCase().includes(query)))
})
const elapsed = computed(() => `${(elapsedTenths.value / 10).toFixed(1)}s`)
const initials = computed(() => user.value?.name.split(' ').map(part => part[0]).join('').slice(0, 2) ?? 'LD')
const isDemo = computed(() => user.value?.role === 'demo')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login', { external: true })
}

function toggleRecording() {
  if (recording.value) {
    finishTurn()
    return
  }

  recording.value = true
  elapsedTenths.value = 0
  timer = setInterval(() => {
    elapsedTenths.value += 1
    waveLevels.value = waveLevels.value.map(() => Math.floor(18 + Math.random() * 74))
  }, 100)
}

function finishTurn() {
  recording.value = false
  if (timer) clearInterval(timer)
  timer = null
  processing.value = true

  setTimeout(async () => {
    processing.value = false
    const durationMs = elapsedTenths.value * 100
    turnError.value = ''

    if (isDemo.value) {
      recentTurns.value.unshift({
        id: `demo_${crypto.randomUUID().slice(0, 8)}`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        duration: `${(durationMs / 1000).toFixed(1)}s`,
        route: routeMode.value === 'standard' ? 'Fallback' : 'Direct',
        model: routeMode.value === 'standard' ? 'STT + LLM' : selectedModel.value,
        latency: routeMode.value === 'standard' ? '842ms' : '496ms',
        signal: 'Natural cadence',
        status: 'Complete',
        transcript: shadowTranscripts.value ? 'Demo transcript generated locally for this session.' : 'Transcript disabled for this turn.',
      })
      elapsedTenths.value = 0
      return
    }

    try {
      const result = await $fetch<{ turn: Turn }>('/api/voice/turns', {
        method: 'POST',
        body: {
          durationMs,
          route: routeMode.value === 'standard' ? 'fallback' : 'direct',
          model: routeMode.value === 'standard' ? 'STT + LLM' : selectedModel.value,
          latencyMs: routeMode.value === 'standard' ? 842 : 496,
          signal: 'Natural cadence',
          status: 'complete',
          transcript: shadowTranscripts.value ? 'Shadow transcript generated beside the audio-native reasoning path.' : null,
          acousticSignals: acousticSignals.value ? { cadence: 'natural' } : {},
        },
      })
      recentTurns.value.unshift(result.turn)
    } catch {
      turnError.value = 'The simulated turn completed but could not be persisted.'
    }

    elapsedTenths.value = 0
  }, 700)
}

async function savePolicy() {
  policySaving.value = true
  policyStatus.value = 'Saving…'
  const retentionHours = ({ 'Transient only': 0, '1 hour': 1, '24 hours': 24, '7 days': 168 } as Record<string, number>)[retention.value] ?? 24

  try {
    await $fetch('/api/data-policy', {
      method: 'PATCH',
      body: {
        shadowTranscripts: shadowTranscripts.value,
        consentLogging: consentLogging.value,
        acousticSignals: acousticSignals.value,
        rawAudioRetentionHours: retentionHours,
      },
    })
    policyStatus.value = 'Policy saved'
  } catch {
    policyStatus.value = 'Unable to save policy'
  } finally {
    policySaving.value = false
  }
}

function showTurn(turn: Turn) {
  activeView.value = 'sessions'
  search.value = turn.id
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

useHead({
  title: 'Dashboard · Listen Direct',
  meta: [{ name: 'description', content: 'Operate and observe audio-native voice sessions.' }],
})
</script>

<template>
  <div class="dashboard">
    <aside class="sidebar">
      <NuxtLink class="dash-brand" to="/" aria-label="Listen Direct home">
        <span class="dash-brand-mark"><i /><i /><i /></span>
        <span>LISTEN<strong>/DIRECT</strong></span>
      </NuxtLink>

      <div class="workspace-switcher">
        <span>WORKSPACE</span>
        <button>{{ user?.workspace ?? 'Workspace' }} <b>⌄</b></button>
      </div>

      <nav aria-label="Dashboard navigation">
        <button v-for="item in navigation" :key="item.id" :class="{ active: activeView === item.id }" @click="activeView = item.id">
          <span>{{ item.hint }}</span>{{ item.label }}
        </button>
      </nav>

      <NuxtLink v-if="user?.role === 'admin'" class="admin-link" to="/admin"><span>⌘</span> Administration</NuxtLink>

      <div class="sidebar-status">
        <div><span class="status-dot" /> System operational</div>
        <small>99.98% · last 30 days</small>
      </div>
      <div class="sidebar-legal"><NuxtLink to="/privacy">Privacy</NuxtLink><NuxtLink to="/terms">Terms</NuxtLink></div>
      <div class="profile"><span>{{ initials }}</span><div><strong>{{ user?.name }}</strong><small>{{ user?.role.toUpperCase() }}</small></div><button aria-label="Sign out" title="Sign out" @click="logout">↗</button></div>
    </aside>

    <main class="dashboard-main">
      <header class="dashboard-header">
        <div><span>VOICE OPERATIONS / {{ activeView.toUpperCase() }}</span><h1>{{ pageTitle }}</h1></div>
        <div class="header-actions">
          <button class="icon-button" aria-label="Notifications">●<span>2</span></button>
          <button class="session-button" :class="{ recording }" @click="toggleRecording">
            <i />{{ recording ? `End turn · ${elapsed}` : processing ? 'Processing…' : 'Start live turn' }}
          </button>
        </div>
      </header>

      <div v-if="isDemo" class="demo-banner"><div><span>DEMO SANDBOX</span><strong>Explore safely—new voice turns remain in this browser session and policies are read-only.</strong></div><button @click="logout">Exit demo</button></div>
      <p v-if="turnError" class="persistence-error" role="alert">{{ turnError }}</p>

      <template v-if="activeView === 'overview'">
        <section class="metric-grid" aria-label="Current performance">
          <article><div><span>DIRECT ROUTE RATE</span><b class="trend up">↗ 4.2%</b></div><strong>94.7<small>%</small></strong><p>12,842 of 13,561 turns</p></article>
          <article><div><span>MEDIAN LATENCY</span><b class="trend up">↓ 38ms</b></div><strong>482<small>ms</small></strong><p>Audio in → first audio out</p></article>
          <article><div><span>TURN SUCCESS</span><b class="trend up">↗ 0.6%</b></div><strong>99.2<small>%</small></strong><p>Completed without interruption</p></article>
          <article><div><span>FALLBACKS TODAY</span><b class="trend neutral">719 turns</b></div><strong>5.3<small>%</small></strong><p>Noise is the leading trigger</p></article>
        </section>

        <section class="operations-grid">
          <article class="console-card panel">
            <div class="panel-head"><div><span>LIVE TURN CONSOLE</span><strong>{{ recording ? 'Listening now' : processing ? 'Reasoning over audio' : 'Ready for input' }}</strong></div><div class="live-state" :class="{ active: recording }"><i />{{ recording ? 'LIVE' : 'STANDBY' }}</div></div>
            <div class="console-body">
              <button class="record-orb" :class="{ recording, processing }" :aria-label="recording ? 'Stop recording' : 'Start recording'" @click="toggleRecording"><span>{{ recording ? '■' : processing ? '···' : '▶' }}</span></button>
              <div class="waveform" :class="{ recording }" aria-hidden="true"><i v-for="(level, index) in waveLevels" :key="index" :style="{ height: `${recording ? level : Math.max(12, level * 0.34)}%` }" /></div>
              <div class="duration"><strong>{{ elapsed }}</strong><span>TURN LENGTH</span></div>
            </div>
            <div class="signal-strip">
              <div><span>INPUT</span><strong>PCM16 · 24 kHz</strong></div><div><span>ENERGY</span><strong>{{ recording ? '−18.4 dB' : '—' }}</strong></div><div><span>PITCH</span><strong>{{ recording ? 'Elevated' : '—' }}</strong></div><div><span>END-OF-TURN</span><strong>{{ recording ? 'Listening' : 'Semantic' }}</strong></div>
            </div>
          </article>

          <article class="route-card panel">
            <div class="panel-head"><div><span>ACTIVE ROUTE</span><strong>Adaptive dual path</strong></div><button class="text-button" @click="activeView = 'controls'">Configure ↗</button></div>
            <div class="route-selector">
              <button v-for="route in (['adaptive', 'direct', 'standard'] as RouteMode[])" :key="route" :class="{ active: routeMode === route }" @click="routeMode = route"><i />{{ route }}</button>
            </div>
            <div class="route-flow">
              <div><span>01</span><strong>Voice turn</strong><small>audio/pcm</small></div><b>→</b><div class="router-node"><span>02</span><strong>Route gate</strong><small>{{ routeMode }}</small></div><b>→</b><div><span>03</span><strong>{{ routeMode === 'standard' ? 'STT + LLM' : selectedModel }}</strong><small>{{ routeMode === 'standard' ? 'fallback' : 'audio native' }}</small></div>
            </div>
            <dl><div><dt>Primary model</dt><dd>{{ selectedModel }}</dd></div><div><dt>Fallback threshold</dt><dd>Confidence &lt; 0.72</dd></div><div><dt>Shadow transcript</dt><dd><button class="mini-toggle" :class="{ on: shadowTranscripts }" @click="shadowTranscripts = !shadowTranscripts"><i /></button></dd></div></dl>
          </article>
        </section>

        <section class="turns-panel panel">
          <div class="panel-head"><div><span>RECENT VOICE TURNS</span><strong>Production traffic</strong></div><button class="text-button" @click="activeView = 'sessions'">View all sessions ↗</button></div>
          <div class="table-wrap"><table><thead><tr><th>Turn</th><th>Time</th><th>Route</th><th>Signal</th><th>Model</th><th>Latency</th><th>Status</th></tr></thead><tbody><tr v-for="turn in recentTurns.slice(0, 4)" :key="turn.id" @click="showTurn(turn)"><td><strong>{{ turn.id }}</strong><small>{{ turn.duration }}</small></td><td>{{ turn.time }}</td><td><span class="route-pill" :class="turn.route.toLowerCase()">{{ turn.route }}</span></td><td>{{ turn.signal }}</td><td>{{ turn.model }}</td><td>{{ turn.latency }}</td><td><span class="status-pill" :class="turn.status.toLowerCase()"><i />{{ turn.status }}</span></td></tr></tbody></table></div>
        </section>
      </template>

      <template v-else-if="activeView === 'sessions'">
        <section class="section-toolbar panel"><div><span>SESSION EXPLORER</span><strong>{{ visibleTurns.length }} matching turns</strong></div><label><span>⌕</span><input v-model="search" placeholder="Search turn, signal, or model"></label></section>
        <section class="session-layout">
          <div class="session-list panel"><button v-for="turn in visibleTurns" :key="turn.id" class="session-row"><div><span>{{ turn.id }}</span><strong>{{ turn.transcript }}</strong></div><small>{{ turn.time }} · {{ turn.duration }}</small><span class="route-pill" :class="turn.route.toLowerCase()">{{ turn.route }}</span><b>{{ turn.latency }}</b></button><p v-if="!visibleTurns.length" class="empty">No voice turns match that search.</p></div>
          <aside class="session-summary panel"><span>SESSION HEALTH</span><strong>99.2%</strong><p>40 of 40 recent turns completed. One fallback was triggered by background noise.</p><div class="health-ring"><i /><b>HEALTHY</b></div><dl><div><dt>Average duration</dt><dd>6.0s</dd></div><div><dt>P95 latency</dt><dd>812ms</dd></div><div><dt>Barge-ins</dt><dd>3</dd></div></dl></aside>
        </section>
      </template>

      <template v-else-if="activeView === 'models'">
        <section class="registry-intro panel"><div><span>CAPABILITY REGISTRY</span><h2>One interface. Every audio model.</h2><p>Negotiate codecs, latency limits, and fallback behavior before a voice turn begins.</p></div><button class="session-button">+ Register model</button></section>
        <section class="model-grid"><article v-for="modelItem in models" :key="modelItem.name" class="model-card panel" :class="{ selected: selectedModel === modelItem.name }" @click="selectedModel = modelItem.name"><div class="model-top"><span>{{ modelItem.provider }}</span><b><i />{{ modelItem.status }}</b></div><h3>{{ modelItem.name }}</h3><p>{{ modelItem.codecs }}</p><div class="quality"><span>PERCEPTION SCORE</span><strong>{{ modelItem.quality }}</strong><i><b :style="{ width: `${modelItem.quality}%` }" /></i></div><dl><div><dt>Median latency</dt><dd>{{ modelItem.latency }}</dd></div><div><dt>Streaming</dt><dd>Full duplex</dd></div></dl><button>{{ selectedModel === modelItem.name ? 'Active primary' : 'Set as primary' }}</button></article></section>
      </template>

      <template v-else-if="activeView === 'evals'">
        <section class="registry-intro panel"><div><span>AUDIO-NATIVE EVALUATION</span><h2>Measure what transcripts miss.</h2><p>Compare direct audio reasoning with the cascaded baseline across real acoustic conditions.</p></div><button class="session-button">Run evaluation</button></section>
        <section class="eval-grid"><article v-for="suite in evaluationSuites" :key="suite.title" class="eval-card panel"><div><span>{{ suite.title }}</span><b>{{ suite.change }}</b></div><strong>{{ suite.score }}<small>/100</small></strong><div class="eval-bar"><i :style="{ width: `${suite.score}%` }" /></div><p>{{ suite.runs }} paired test runs</p></article></section>
        <section class="comparison panel"><div class="panel-head"><div><span>DIRECT VS CASCADED</span><strong>Perception advantage by signal</strong></div><small>Last 7 days</small></div><div class="comparison-chart"><div v-for="(suite, index) in evaluationSuites" :key="suite.title"><span>{{ suite.title }}</span><i><b :style="{ width: `${72 + index * 6}%` }" /><em :style="{ width: `${48 + index * 4}%` }" /></i><strong>+{{ 18 - index * 2 }} pts</strong></div></div><footer><span><i class="direct-key" /> Direct audio</span><span><i class="base-key" /> STT baseline</span></footer></section>
      </template>

      <template v-else>
        <section class="registry-intro panel"><div><span>ACOUSTIC DATA CONTROLS</span><h2>Keep the signal. Control the footprint.</h2><p>Define what is retained, logged, redacted, and exposed to downstream applications.</p></div><div class="policy-actions"><span class="saved-state"><i /> {{ policyStatus }}</span><button class="session-button" :disabled="policySaving || isDemo" @click="savePolicy">Save policy</button></div></section>
        <section class="control-grid">
          <article class="control-card panel"><div><span>SHADOW TRANSCRIPTS</span><button class="mini-toggle" :class="{ on: shadowTranscripts }" @click="shadowTranscripts = !shadowTranscripts"><i /></button></div><h3>Generate text beside the direct path</h3><p>Use captions and debugging text without making it the model’s input.</p></article>
          <article class="control-card panel"><div><span>CONSENT-AWARE LOGGING</span><button class="mini-toggle" :class="{ on: consentLogging }" @click="consentLogging = !consentLogging"><i /></button></div><h3>Respect session consent state</h3><p>Store traces only when the client has supplied a valid consent signal.</p></article>
          <article class="control-card panel"><div><span>ACOUSTIC SIGNALS</span><button class="mini-toggle" :class="{ on: acousticSignals }" @click="acousticSignals = !acousticSignals"><i /></button></div><h3>Expose non-sensitive vocal features</h3><p>Return pitch, energy, cadence, and turn-taking signals to the application.</p></article>
          <article class="control-card panel"><div><span>RAW AUDIO RETENTION</span><select v-model="retention"><option>Transient only</option><option>1 hour</option><option>24 hours</option><option>7 days</option></select></div><h3>{{ retention }}</h3><p>Automatically purge raw audio after the configured retention window.</p></article>
        </section>
        <section class="policy-code panel"><div class="panel-head"><div><span>ACTIVE POLICY</span><strong>production-default</strong></div><button class="text-button">Copy JSON</button></div><pre><code>{
  "routing": "{{ routeMode }}",
  "shadow_transcript": {{ shadowTranscripts }},
  "consent_logging": {{ consentLogging }},
  "acoustic_signals": {{ acousticSignals }},
  "raw_audio_retention": "{{ retention }}"
}</code></pre></section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.dashboard{--d-bg:#080c09;--d-panel:#101612;--d-panel-2:#0c110e;--d-line:#dff4d51a;--d-muted:#849083;--d-ink:#eef4e9;--d-lime:#c6ff4a;min-height:100vh;background:radial-gradient(circle at 76% -10%,#8fcf3820,transparent 28rem),var(--d-bg);color:var(--d-ink);display:grid;grid-template-columns:248px 1fr;font-family:Arial,Helvetica,sans-serif}.sidebar{min-height:100vh;border-right:1px solid var(--d-line);background:#090d0aeb;position:sticky;top:0;height:100vh;padding:26px 20px 20px;display:flex;flex-direction:column}.dash-brand{display:flex;align-items:center;gap:12px;letter-spacing:.11em;font-size:12px;font-weight:800;padding:2px 8px 24px}.dash-brand strong{color:var(--d-lime)}.dash-brand-mark{width:27px;height:27px;border:1px solid var(--d-lime);display:flex;justify-content:center;align-items:center;gap:2px}.dash-brand-mark i{display:block;width:2px;height:8px;background:var(--d-lime)}.dash-brand-mark i:nth-child(2){height:15px}.dash-brand-mark i:nth-child(3){height:5px}.workspace-switcher{border-top:1px solid var(--d-line);border-bottom:1px solid var(--d-line);padding:18px 8px}.workspace-switcher>span,.panel-head span,.section-toolbar>div>span,.registry-intro>div>span,.session-summary>span{display:block;color:#697468;letter-spacing:.15em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:8px}.workspace-switcher button{width:100%;display:flex;justify-content:space-between;color:var(--d-ink);font-size:12px;cursor:pointer}.workspace-switcher b{color:var(--d-muted)}.sidebar nav{display:flex;flex-direction:column;gap:5px;margin-top:22px}.sidebar nav button{border:1px solid transparent;color:var(--d-muted);padding:11px 10px;text-align:left;display:flex;align-items:center;gap:12px;font-size:12px;cursor:pointer}.sidebar nav button span{color:#596359;font:9px ui-monospace,SFMono-Regular,Menlo,monospace}.sidebar nav button:hover{color:var(--d-ink);background:#ffffff05}.sidebar nav button.active{color:#10160b;background:var(--d-lime);font-weight:700}.sidebar nav button.active span{color:#45600e}.sidebar-status{margin-top:auto;border:1px solid var(--d-line);background:#ffffff03;padding:13px}.sidebar-status div{font-size:10px;display:flex;gap:8px;align-items:center}.status-dot,.live-state i,.status-pill i,.model-top b i,.saved-state i{width:6px;height:6px;background:var(--d-lime);border-radius:50%;box-shadow:0 0 10px #c6ff4a80}.sidebar-status small{color:#687267;font-size:9px;display:block;margin:7px 0 0 14px}.profile{border-top:1px solid var(--d-line);margin-top:16px;padding:16px 4px 0;display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center}.profile>span{width:34px;height:34px;border-radius:50%;background:#1c2817;color:var(--d-lime);display:grid;place-items:center;font-size:10px;font-weight:800}.profile strong,.profile small{display:block}.profile strong{font-size:11px}.profile small{color:var(--d-muted);font-size:9px;margin-top:3px}.profile button{color:var(--d-muted);cursor:pointer}.dashboard-main{padding:0 34px 50px;min-width:0}.dashboard-header{height:110px;border-bottom:1px solid var(--d-line);display:flex;justify-content:space-between;align-items:center}.dashboard-header>div:first-child>span{color:#727d72;letter-spacing:.16em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.dashboard h1{font-size:30px;line-height:1;letter-spacing:-.04em;margin:10px 0 0;font-weight:500}.header-actions{display:flex;gap:10px;align-items:center}.icon-button{width:39px;height:39px;border:1px solid var(--d-line);color:#6d786c;position:relative;cursor:pointer}.icon-button span{position:absolute;right:5px;top:4px;background:var(--d-lime);color:#0c1208;font-size:7px;border-radius:8px;padding:2px 4px}.session-button{min-height:40px;background:var(--d-lime);color:#11170b;padding:0 17px;text-transform:uppercase;letter-spacing:.09em;font-size:9px;font-weight:800;cursor:pointer}.session-button i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#11170b;margin-right:9px}.session-button.recording{background:#ff7f68}.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);border-left:1px solid var(--d-line);margin-top:26px}.metric-grid article{min-width:0;background:var(--d-panel-2);border-top:1px solid var(--d-line);border-right:1px solid var(--d-line);border-bottom:1px solid var(--d-line);padding:18px 19px}.metric-grid article>div{display:flex;justify-content:space-between;gap:10px}.metric-grid span{color:#697469;letter-spacing:.12em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.metric-grid article>strong{font:400 34px/1 ui-monospace,SFMono-Regular,Menlo,monospace;display:block;margin:19px 0 10px}.metric-grid article>strong small{color:var(--d-muted);font-size:13px;margin-left:3px}.metric-grid p{color:#6f796e;font-size:9px;margin:0}.trend{font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.trend.up{color:var(--d-lime)}.trend.neutral{color:#899388}.operations-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.9fr);gap:18px;margin-top:18px}.panel{border:1px solid var(--d-line);background:linear-gradient(145deg,#131a15,#0d120f)}.panel-head{height:67px;border-bottom:1px solid var(--d-line);display:flex;justify-content:space-between;align-items:center;padding:0 19px}.panel-head span{margin:0 0 6px}.panel-head strong{font-size:13px;font-weight:600}.live-state{color:#697469;border:1px solid var(--d-line);padding:7px 9px;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.live-state i{display:inline-block;background:#596359;box-shadow:none;margin-right:7px}.live-state.active{color:var(--d-lime);border-color:#c6ff4a45}.live-state.active i{background:var(--d-lime);box-shadow:0 0 10px #c6ff4a80}.console-body{height:178px;display:grid;grid-template-columns:70px 1fr 74px;gap:20px;align-items:center;padding:0 22px}.record-orb{width:58px;height:58px;border-radius:50%;border:1px solid #c6ff4a55;background:#c6ff4a0d;color:var(--d-lime);display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 0 28px #c6ff4a0b}.record-orb.recording{animation:recordPulse 1.3s ease-in-out infinite;background:#c6ff4a1a}.record-orb.processing{border-color:#f2cf6d;color:#f2cf6d}.record-orb span{font-size:13px}.waveform{height:86px;display:flex;align-items:center;gap:5px}.waveform i{width:3px;flex:1;max-width:5px;border-radius:4px;background:#526248;transition:height .12s ease,background .2s}.waveform.recording i{background:var(--d-lime);box-shadow:0 0 10px #c6ff4a45}.duration{border-left:1px solid var(--d-line);padding-left:18px}.duration strong{font:400 24px ui-monospace,SFMono-Regular,Menlo,monospace}.duration span{display:block;color:#687267;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:7px;letter-spacing:.1em}.signal-strip{min-height:62px;border-top:1px solid var(--d-line);display:grid;grid-template-columns:repeat(4,1fr)}.signal-strip div{padding:14px 16px;border-right:1px solid var(--d-line)}.signal-strip div:last-child{border:0}.signal-strip span,.signal-strip strong{display:block}.signal-strip span{color:#647064;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}.signal-strip strong{font-size:10px;margin-top:7px}.text-button{color:var(--d-lime);font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;cursor:pointer}.route-selector{display:grid;grid-template-columns:repeat(3,1fr);margin:18px;border:1px solid var(--d-line)}.route-selector button{padding:10px 5px;color:#6d786d;text-transform:uppercase;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer;border-right:1px solid var(--d-line)}.route-selector button:last-child{border:0}.route-selector button i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#4d574d;margin-right:6px}.route-selector button.active{color:#12190b;background:var(--d-lime)}.route-selector button.active i{background:#12190b}.route-flow{display:grid;grid-template-columns:1fr 16px 1fr 16px 1fr;align-items:center;padding:12px 18px 20px}.route-flow>div{border:1px solid var(--d-line);background:#080c09;padding:12px;min-width:0}.route-flow>div.router-node{border-color:#c6ff4a55}.route-flow>div span,.route-flow>div strong,.route-flow>div small{display:block}.route-flow>div span{color:#687368;font:8px ui-monospace,SFMono-Regular,Menlo,monospace}.route-flow>div strong{font-size:9px;margin:13px 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.route-flow>div small{color:var(--d-lime);font:7px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.route-flow>b{color:#556055;text-align:center;font-weight:400}.route-card dl,.session-summary dl,.model-card dl{border-top:1px solid var(--d-line);margin:0;padding:9px 18px}.route-card dl div,.session-summary dl div,.model-card dl div{display:flex;justify-content:space-between;align-items:center;padding:7px 0}.route-card dt,.session-summary dt,.model-card dt{color:#727d72;font-size:9px}.route-card dd,.session-summary dd,.model-card dd{margin:0;font-size:9px}.mini-toggle{width:30px;height:16px;border-radius:12px;background:#283027;padding:2px;cursor:pointer;transition:background .2s}.mini-toggle i{display:block;width:12px;height:12px;background:#768075;border-radius:50%;transition:transform .2s}.mini-toggle.on{background:var(--d-lime)}.mini-toggle.on i{background:#12180c;transform:translateX(14px)}.turns-panel{margin-top:18px}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:820px}th{text-align:left;color:#626d62;letter-spacing:.12em;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace;padding:13px 16px;border-bottom:1px solid var(--d-line)}td{padding:13px 16px;color:#9ca69a;font-size:10px;border-bottom:1px solid #dff4d50d}tbody tr{cursor:pointer}tbody tr:hover{background:#ffffff04}td strong,td small{display:block}td strong{color:var(--d-ink);font:600 10px ui-monospace,SFMono-Regular,Menlo,monospace}td small{color:#657064;margin-top:4px;font-size:8px}.route-pill,.status-pill{display:inline-flex;align-items:center;border:1px solid var(--d-line);padding:5px 7px;text-transform:uppercase;letter-spacing:.08em;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace}.route-pill.direct{color:var(--d-lime);border-color:#c6ff4a36}.route-pill.fallback{color:#f2cf6d;border-color:#f2cf6d40}.status-pill i{display:inline-block;width:4px;height:4px;margin-right:6px}.status-pill.flagged{color:#f2cf6d}.status-pill.flagged i{background:#f2cf6d;box-shadow:none}.section-toolbar{margin-top:26px;min-height:74px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between}.section-toolbar>div>span{margin-bottom:7px}.section-toolbar>div>strong{font-size:13px}.section-toolbar label{border:1px solid var(--d-line);height:37px;width:min(360px,48%);display:flex;align-items:center;padding:0 12px;gap:9px}.section-toolbar label span{color:var(--d-muted)}.section-toolbar input{width:100%;outline:0;color:var(--d-ink);font-size:11px}.section-toolbar input::placeholder{color:#5e685e}.session-layout{display:grid;grid-template-columns:1fr 280px;gap:18px;margin-top:18px}.session-list{padding:8px}.session-row{display:grid;grid-template-columns:1fr 100px 76px 60px;gap:16px;align-items:center;width:100%;text-align:left;padding:17px 14px;border-bottom:1px solid var(--d-line);cursor:pointer}.session-row:hover{background:#ffffff04}.session-row>div span,.session-row>div strong{display:block}.session-row>div span{color:var(--d-lime);font:8px ui-monospace,SFMono-Regular,Menlo,monospace}.session-row>div strong{font-size:11px;margin-top:6px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.session-row>small{color:var(--d-muted);font-size:9px}.session-row>b{font:500 9px ui-monospace,SFMono-Regular,Menlo,monospace}.empty{color:var(--d-muted);padding:30px;text-align:center}.session-summary{padding:22px;align-self:start}.session-summary>strong{font:400 44px ui-monospace,SFMono-Regular,Menlo,monospace}.session-summary>p{color:var(--d-muted);font-size:11px;line-height:1.7}.health-ring{height:150px;border:1px solid var(--d-line);margin:20px 0;display:grid;place-items:center;position:relative}.health-ring i{width:86px;height:86px;border-radius:50%;border:7px solid #2a3527;border-top-color:var(--d-lime);border-right-color:var(--d-lime);transform:rotate(35deg)}.health-ring b{position:absolute;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--d-lime)}.session-summary dl{padding:0}.registry-intro{margin-top:26px;min-height:160px;padding:28px;display:flex;align-items:center;justify-content:space-between}.registry-intro h2{font-size:32px;letter-spacing:-.04em;margin:8px 0 12px;font-weight:500}.registry-intro p{color:var(--d-muted);font-size:12px;margin:0;max-width:570px;line-height:1.7}.model-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:18px}.model-card{padding:21px;cursor:pointer;transition:border-color .2s,transform .2s}.model-card:hover{transform:translateY(-2px)}.model-card.selected{border-color:#c6ff4a66;background:linear-gradient(145deg,#172116,#0d120f)}.model-top{display:flex;justify-content:space-between;color:#6f7a6e;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.1em}.model-top b{color:var(--d-lime);font-weight:700}.model-top b i{display:inline-block;width:5px;height:5px;margin-right:5px}.model-card h3{font-size:21px;margin:34px 0 8px;font-weight:500}.model-card>p{color:var(--d-muted);font:9px ui-monospace,SFMono-Regular,Menlo,monospace}.quality{border-top:1px solid var(--d-line);border-bottom:1px solid var(--d-line);padding:18px 0;margin:22px 0}.quality>span{color:#6a7569;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}.quality>strong{display:block;font:400 31px ui-monospace,SFMono-Regular,Menlo,monospace;margin:11px 0}.quality>i{display:block;height:3px;background:#283027}.quality>i b{display:block;height:100%;background:var(--d-lime)}.model-card dl{padding:0;border:0}.model-card>button{width:100%;border:1px solid var(--d-line);padding:11px;color:var(--d-muted);margin-top:18px;text-transform:uppercase;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.model-card.selected>button{background:var(--d-lime);color:#11170b}.eval-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}.eval-card{padding:19px}.eval-card>div:first-child{display:flex;justify-content:space-between;color:#778176;font-size:9px}.eval-card>div:first-child b{color:var(--d-lime)}.eval-card>strong{display:block;font:400 34px ui-monospace,SFMono-Regular,Menlo,monospace;margin:27px 0 14px}.eval-card>strong small{font-size:10px;color:#6c766b}.eval-bar{height:3px;background:#283027}.eval-bar i{display:block;height:100%;background:var(--d-lime)}.eval-card p{color:#687268;font-size:9px;margin:14px 0 0}.comparison{margin-top:18px}.comparison-chart{padding:26px}.comparison-chart>div{display:grid;grid-template-columns:150px 1fr 55px;align-items:center;gap:18px;margin-bottom:22px}.comparison-chart span{font-size:10px}.comparison-chart>div>i{height:18px;position:relative;display:block}.comparison-chart>div>i b,.comparison-chart>div>i em{position:absolute;left:0;height:6px}.comparison-chart>div>i b{top:1px;background:var(--d-lime)}.comparison-chart>div>i em{bottom:1px;background:#52604c}.comparison-chart>div>strong{color:var(--d-lime);font:700 9px ui-monospace,SFMono-Regular,Menlo,monospace}.comparison footer{border-top:1px solid var(--d-line);padding:14px 26px;display:flex;gap:22px;color:var(--d-muted);font-size:9px}.comparison footer i{display:inline-block;width:14px;height:4px;margin-right:7px}.direct-key{background:var(--d-lime)}.base-key{background:#52604c}.saved-state{color:var(--d-lime);font:700 9px ui-monospace,SFMono-Regular,Menlo,monospace}.saved-state i{display:inline-block;margin-right:7px}.control-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:18px}.control-card{padding:23px}.control-card>div{display:flex;justify-content:space-between;align-items:center}.control-card>div>span{color:#6e796d;letter-spacing:.13em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.control-card h3{font-size:17px;margin:30px 0 10px;font-weight:500}.control-card p{color:var(--d-muted);font-size:11px;line-height:1.7;margin:0}.control-card select{color:var(--d-lime);background:#111812;border:1px solid var(--d-line);padding:7px;font-size:9px}.policy-code{margin-top:18px}.policy-code pre{margin:0;padding:24px;color:#b7c2b3;overflow:auto;font:11px/1.8 ui-monospace,SFMono-Regular,Menlo,monospace}.policy-code code{font:inherit}@keyframes recordPulse{50%{box-shadow:0 0 0 9px #c6ff4a0b,inset 0 0 30px #c6ff4a20}}@media (max-width:1100px){.dashboard{grid-template-columns:210px 1fr}.dashboard-main{padding-inline:22px}.metric-grid{grid-template-columns:repeat(2,1fr)}.operations-grid{grid-template-columns:1fr}.model-grid{grid-template-columns:1fr}.eval-grid{grid-template-columns:repeat(2,1fr)}}@media (max-width:760px){.dashboard{display:block}.sidebar{position:static;width:auto;height:auto;min-height:0;padding:16px}.sidebar nav{flex-direction:row;overflow-x:auto}.sidebar nav button{white-space:nowrap}.workspace-switcher,.sidebar-status,.profile{display:none}.dashboard-main{padding:0 14px 36px}.dashboard-header{height:auto;padding:22px 0;gap:14px}.dashboard h1{font-size:24px}.icon-button{display:none}.session-button{padding:0 12px}.metric-grid{grid-template-columns:1fr}.operations-grid{grid-template-columns:1fr}.console-body{grid-template-columns:55px 1fr}.duration{display:none}.signal-strip{grid-template-columns:repeat(2,1fr)}.route-flow{overflow-x:auto}.turns-panel{overflow:hidden}.section-toolbar,.registry-intro{align-items:flex-start;gap:20px;flex-direction:column}.section-toolbar label{width:100%}.session-layout{grid-template-columns:1fr}.session-row{grid-template-columns:1fr 64px}.session-row>small,.session-row>b{display:none}.model-grid,.eval-grid,.control-grid{grid-template-columns:1fr}.comparison-chart>div{grid-template-columns:95px 1fr 42px}.registry-intro h2{font-size:26px}}
</style>

<style scoped>
.admin-link {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 12px;
  border: 1px solid #c6ff4a3d;
  color: #c6ff4a;
  padding: 11px 10px;
  font-size: 11px;
}

.admin-link span {
  font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.demo-banner {
  min-height: 58px;
  margin-top: 18px;
  border: 1px solid #f2cf6d45;
  background: #f2cf6d0a;
  padding: 11px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.demo-banner span,
.demo-banner strong {
  display: block;
}

.demo-banner span {
  color: #f2cf6d;
  letter-spacing: .13em;
  font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace;
  margin-bottom: 5px;
}

.demo-banner strong {
  font-size: 10px;
  font-weight: 500;
}

.demo-banner button {
  color: #f2cf6d;
  border: 1px solid #f2cf6d45;
  padding: 8px 10px;
  text-transform: uppercase;
  letter-spacing: .09em;
  font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace;
  cursor: pointer;
}

.persistence-error {
  border: 1px solid #ff80664a;
  background: #ff80660c;
  color: #ff9c88;
  margin: 18px 0 0;
  padding: 11px 14px;
  font-size: 10px;
}

.policy-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.policy-actions .session-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .demo-banner {
    align-items: flex-start;
  }
}
</style>
