<script setup lang="ts">
definePageMeta({ middleware: 'authenticated' })

type ViewName = 'overview' | 'notifications' | 'sessions' | 'models' | 'evals' | 'controls'
type RouteMode = 'adaptive' | 'direct' | 'standard'
type NotificationSeverity = 'critical' | 'warning' | 'info'
type NotificationStatus = 'open' | 'resolved'
type NotificationFilter = 'open' | 'assistance' | 'resolved' | 'all'

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

type NotificationItem = {
  id: string
  title: string
  summary: string
  severity: NotificationSeverity
  status: NotificationStatus
  category: 'routing' | 'privacy' | 'model'
  time: string
  source: string
  relatedTurnId?: string
  requiresAssistance: boolean
  diagnosis: string
  assistantPlan: string[]
  suggestedAction: string
  resolution?: string
}

const navigation: { id: ViewName; label: string; hint: string }[] = [
  { id: 'overview', label: 'Operations overview', hint: '01' },
  { id: 'notifications', label: 'Notifications', hint: '02' },
  { id: 'sessions', label: 'Sessions', hint: '03' },
  { id: 'models', label: 'Model registry', hint: '04' },
  { id: 'evals', label: 'Audio evals', hint: '05' },
  { id: 'controls', label: 'Data controls', hint: '06' },
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

const seededNotifications: NotificationItem[] = [
  {
    id: 'notice_route_01',
    title: 'Noise fallbacks crossed the review threshold',
    summary: 'Three representative turns fell back after Direct confidence dropped below the current workspace floor.',
    severity: 'warning',
    status: 'open',
    category: 'routing',
    time: '4 min ago',
    source: 'Adaptive route monitor',
    relatedTurnId: 'demo_noise_02',
    requiresAssistance: true,
    diagnosis: 'The route is behaving safely, but the current Direct confidence floor allows noisy turns to stay on the primary path longer than intended.',
    assistantPlan: [
      'Keep Adaptive routing active so unsupported turns retain a safe fallback.',
      'Raise the representative Direct confidence floor from 0.72 to 0.78 for noisy conditions.',
      'Review the next 30 representative turns before promoting the change to a production policy.',
    ],
    suggestedAction: 'Use Adaptive routing with a stricter representative confidence floor and keep Standard as the fallback.',
  },
  {
    id: 'notice_privacy_02',
    title: 'Retention setting needs a consent-safe default',
    summary: 'The current 24-hour raw-audio setting is longer than the minimum needed for this simulated workspace.',
    severity: 'critical',
    status: 'open',
    category: 'privacy',
    time: '18 min ago',
    source: 'Data policy guard',
    requiresAssistance: true,
    diagnosis: 'The policy is valid for the prototype, but it does not follow the shortest-retention principle described in the workspace guidance.',
    assistantPlan: [
      'Change raw-audio retention to Transient only.',
      'Keep consent-aware logging enabled before any future trace storage.',
      'Require operator review before persisting the recommendation to a protected workspace.',
    ],
    suggestedAction: 'Set raw-audio retention to Transient only and keep consent-aware logging enabled.',
  },
  {
    id: 'notice_model_03',
    title: 'Representative model registry is synchronized',
    summary: 'All three demonstration model profiles expose compatible codec and streaming metadata.',
    severity: 'info',
    status: 'resolved',
    category: 'model',
    time: 'Yesterday',
    source: 'Capability registry',
    requiresAssistance: false,
    diagnosis: 'No intervention is required.',
    assistantPlan: [],
    suggestedAction: 'No correction required.',
    resolution: 'Closed automatically after the representative registry check completed.',
  },
]

const notificationFilters: { id: NotificationFilter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'assistance', label: 'Needs assistance' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
]

const route = useRoute()
const isGuestDemo = computed(() => route.query.demo === '1')
const guestUser: AppUser = {
  id: 'guest-demo',
  name: 'Demo Explorer',
  email: 'guest@local.demo',
  role: 'demo',
  workspace: 'Listen Direct Playground',
  organizationId: 'guest-demo',
}
const guestDemoTurns: Turn[] = [
  { id: 'demo_tone_01', time: '14:32:09', duration: '4.8s', route: 'Direct', model: 'Inkling Audio', latency: '496ms', signal: 'Elevated pitch', status: 'Complete', transcript: 'Can you tell that I am asking this in a higher pitch?' },
  { id: 'demo_noise_02', time: '14:28:41', duration: '6.2s', route: 'Fallback', model: 'STT + LLM', latency: '842ms', signal: 'Background noise', status: 'Flagged', transcript: 'The representative route fell back after the confidence threshold was crossed.' },
]
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const identity = ref<{ user: AppUser } | null>(isGuestDemo.value ? { user: guestUser } : null)
const persistedTurns = ref<{ turns: Turn[] } | null>(null)
const persistedPolicy = ref<{ policy: DataPolicy } | null>(null)

if (!isGuestDemo.value) {
  const [identityResult, turnsResult, policyResult] = await Promise.all([
    $fetch<{ user: AppUser }>('/api/auth/me', { headers: requestHeaders }),
    $fetch<{ turns: Turn[] }>('/api/voice/turns', { headers: requestHeaders }),
    $fetch<{ policy: DataPolicy }>('/api/data-policy', { headers: requestHeaders }),
  ])
  identity.value = identityResult
  persistedTurns.value = turnsResult
  persistedPolicy.value = policyResult
}

const recentTurns = ref<Turn[]>(isGuestDemo.value ? guestDemoTurns : persistedTurns.value?.turns ?? [])

const requestedView = typeof route.query.view === 'string' && navigation.some(item => item.id === route.query.view) ? route.query.view as ViewName : 'overview'
const activeView = ref<ViewName>(requestedView)
const user = computed(() => identity.value?.user)
const routeMode = ref<RouteMode>('adaptive')
const fallbackThreshold = ref(0.72)
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
const onboardingStep = ref(0)
const onboardingDismissed = ref(false)
const notifications = ref<NotificationItem[]>(seededNotifications.map(item => ({ ...item, assistantPlan: [...item.assistantPlan] })))
const notificationFilter = ref<NotificationFilter>('open')
const selectedNotificationId = ref(seededNotifications[0]?.id ?? '')
const assistantWorkingId = ref('')
const assistantReviews = ref<Record<string, boolean>>({})
let timer: ReturnType<typeof setInterval> | null = null
let assistantTimer: ReturnType<typeof setTimeout> | null = null

const onboardingSteps = [
  { title: 'Choose a route', copy: 'Start with Direct so the original acoustic signal stays in the reasoning path.' },
  { title: 'Generate a sample turn', copy: 'Create representative turn evidence without requesting microphone access.' },
  { title: 'Inspect the result', copy: 'Open Sessions and review route, latency, signal, model, and transcript together.' },
]
const onboardingActions = ['Select Direct route', 'Generate sample turn', 'Inspect result']

const pageTitle = computed(() => navigation.find(item => item.id === activeView.value)?.label ?? 'Operations overview')
const visibleTurns = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return recentTurns.value
  return recentTurns.value.filter(turn => Object.values(turn).some(value => value.toLowerCase().includes(query)))
})
const elapsed = computed(() => `${(elapsedTenths.value / 10).toFixed(1)}s`)
const initials = computed(() => user.value?.name.split(' ').map(part => part[0]).join('').slice(0, 2) ?? 'LD')
const isDemo = computed(() => isGuestDemo.value || user.value?.role === 'demo')
const openNotificationCount = computed(() => notifications.value.filter(item => item.status === 'open').length)
const assistanceNotificationCount = computed(() => notifications.value.filter(item => item.status === 'open' && item.requiresAssistance).length)
const resolvedNotificationCount = computed(() => notifications.value.filter(item => item.status === 'resolved').length)
const visibleNotifications = computed(() => notifications.value.filter((item) => {
  if (notificationFilter.value === 'all') return true
  if (notificationFilter.value === 'assistance') return item.status === 'open' && item.requiresAssistance
  return item.status === notificationFilter.value
}))
const selectedNotification = computed(() => {
  const selected = notifications.value.find(item => item.id === selectedNotificationId.value)
  if (selected && visibleNotifications.value.some(item => item.id === selected.id)) return selected
  return visibleNotifications.value[0] ?? null
})
const assistantReady = computed(() => Boolean(selectedNotification.value && assistantReviews.value[selectedNotification.value.id]))

async function logout() {
  if (isGuestDemo.value) {
    await navigateTo('/')
    return
  }
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login', { external: true })
}

function addDemoTurn(transcript = 'Demo transcript generated locally for this browser-only session.') {
  const turn: Turn = {
    id: `demo_${crypto.randomUUID().slice(0, 8)}`,
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    duration: `${Math.max(2.8, elapsedTenths.value / 10).toFixed(1)}s`,
    route: routeMode.value === 'standard' ? 'Fallback' : 'Direct',
    model: routeMode.value === 'standard' ? 'STT + LLM' : selectedModel.value,
    latency: routeMode.value === 'standard' ? '842ms' : '496ms',
    signal: 'Natural cadence',
    status: 'Complete',
    transcript: shadowTranscripts.value ? transcript : 'Transcript disabled for this turn.',
  }
  recentTurns.value.unshift(turn)
  return turn
}

function advanceOnboarding() {
  if (onboardingStep.value === 0) {
    routeMode.value = 'direct'
    onboardingStep.value = 1
    return
  }
  if (onboardingStep.value === 1) {
    addDemoTurn('This guided sample shows the evidence available after a representative direct-audio turn.')
    onboardingStep.value = 2
    return
  }
  if (onboardingStep.value === 2) {
    const turn = recentTurns.value[0]
    if (turn) showTurn(turn)
    onboardingStep.value = 3
  }
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
      addDemoTurn()
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

function openNotifications() {
  activeView.value = 'notifications'
  notificationFilter.value = 'open'
  const firstOpen = notifications.value.find(item => item.status === 'open')
  if (firstOpen) selectedNotificationId.value = firstOpen.id
}

function setNotificationFilter(filter: NotificationFilter) {
  notificationFilter.value = filter
  const firstMatch = notifications.value.find((item) => {
    if (filter === 'all') return true
    if (filter === 'assistance') return item.status === 'open' && item.requiresAssistance
    return item.status === filter
  })
  if (firstMatch) selectedNotificationId.value = firstMatch.id
}

function requestAssistantReview() {
  const item = selectedNotification.value
  if (!item || !item.requiresAssistance || item.status === 'resolved') return
  if (assistantTimer) clearTimeout(assistantTimer)
  assistantWorkingId.value = item.id
  assistantTimer = setTimeout(() => {
    assistantReviews.value = { ...assistantReviews.value, [item.id]: true }
    assistantWorkingId.value = ''
    assistantTimer = null
  }, 650)
}

function applyAssistantCorrection() {
  const item = selectedNotification.value
  if (!item || !assistantReviews.value[item.id] || item.status === 'resolved') return

  if (item.category === 'routing') {
    routeMode.value = 'adaptive'
    fallbackThreshold.value = 0.78
  }
  if (item.category === 'privacy') {
    retention.value = 'Transient only'
    consentLogging.value = true
    policyStatus.value = isDemo.value ? 'Correction applied locally' : 'Review and save policy'
  }

  item.status = 'resolved'
  item.time = 'Just now'
  item.resolution = `Operator approved assistant suggestion: ${item.suggestedAction}`
  notificationFilter.value = 'all'
  selectedNotificationId.value = item.id
}

function resolveNotification() {
  const item = selectedNotification.value
  if (!item || item.status === 'resolved') return
  item.status = 'resolved'
  item.time = 'Just now'
  item.resolution = 'Marked resolved after operator review without an assistant-applied change.'
  notificationFilter.value = 'all'
  selectedNotificationId.value = item.id
}

function reopenNotification() {
  const item = selectedNotification.value
  if (!item) return
  item.status = 'open'
  item.time = 'Just now'
  item.resolution = undefined
  notificationFilter.value = 'open'
  selectedNotificationId.value = item.id
}

function viewNotificationTurn() {
  const item = selectedNotification.value
  if (!item?.relatedTurnId) return
  const turn = recentTurns.value.find(candidate => candidate.id === item.relatedTurnId)
  if (turn) showTurn(turn)
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (assistantTimer) clearTimeout(assistantTimer)
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
        <b>LISTEN<strong>/DIRECT</strong></b>
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
        <div><span class="status-dot" /> Simulation ready</div>
        <small>Representative environment</small>
      </div>
      <div class="sidebar-legal"><NuxtLink to="/help">Help</NuxtLink><NuxtLink to="/privacy">Privacy</NuxtLink><NuxtLink to="/terms">Terms</NuxtLink></div>
      <div class="profile"><span>{{ initials }}</span><div><strong>{{ user?.name }}</strong><small>{{ user?.role.toUpperCase() }}</small></div><button aria-label="Sign out" title="Sign out" @click="logout">↗</button></div>
    </aside>

    <main class="dashboard-main">
      <header class="dashboard-header">
        <div><span>VOICE OPERATIONS / {{ activeView.toUpperCase() }}</span><h1>{{ pageTitle }}</h1></div>
        <div class="header-actions">
          <button class="icon-button" :class="{ active: activeView === 'notifications' }" :aria-label="`Notifications, ${openNotificationCount} open`" @click="openNotifications">◈<span v-if="openNotificationCount">{{ openNotificationCount }}</span></button>
          <button class="session-button" :class="{ recording }" @click="toggleRecording">
            <i />{{ recording ? `End turn · ${elapsed}` : processing ? 'Processing…' : 'Start simulated turn' }}
          </button>
        </div>
      </header>

      <div class="simulation-banner"><div><span>INTERACTIVE SIMULATION</span><strong>No microphone audio is captured and no AI provider is called. Metrics, signals, models, and responses are representative product data.</strong></div><NuxtLink to="/help#understand-the-demo">Understand the scope →</NuxtLink></div>
      <div v-if="isGuestDemo" class="demo-banner"><div><span>GUEST SANDBOX</span><strong>No account required. New turns remain in this browser session and all protected APIs stay unavailable.</strong></div><button @click="logout">Exit sandbox</button></div>
      <div v-else-if="isDemo" class="demo-banner"><div><span>DEMO ACCOUNT</span><strong>Explore safely—new voice turns remain in this browser session and policies are read-only.</strong></div><button @click="logout">Exit demo</button></div>

      <section v-if="isGuestDemo && !onboardingDismissed && activeView === 'overview'" class="onboarding panel" aria-label="Demo onboarding">
        <header><div><span>GUIDED START / {{ Math.min(onboardingStep + 1, 3) }} OF 3</span><h2>{{ onboardingStep < 3 ? 'Prove the workflow in three moves.' : 'You completed the product tour.' }}</h2></div><button aria-label="Dismiss guided start" @click="onboardingDismissed = true">×</button></header>
        <ol><li v-for="(step, index) in onboardingSteps" :key="step.title" :class="{ active: onboardingStep === index, complete: onboardingStep > index }"><span>{{ onboardingStep > index ? '✓' : String(index + 1).padStart(2, '0') }}</span><div><strong>{{ step.title }}</strong><p>{{ step.copy }}</p></div></li></ol>
        <footer><p v-if="onboardingStep < 3">Everything in this tour is generated locally and disappears when the sandbox closes.</p><p v-else>Your sample evidence is open in Sessions. Create a workspace when you are ready to persist operating data.</p><button v-if="onboardingStep < 3" @click="advanceOnboarding">{{ onboardingActions[onboardingStep] }} →</button><NuxtLink v-else to="/login?mode=signup">Create a protected workspace →</NuxtLink></footer>
      </section>
      <p v-if="turnError" class="persistence-error" role="alert">{{ turnError }}</p>

      <template v-if="activeView === 'overview'">
        <section class="metric-grid" aria-label="Representative performance metrics">
          <article><div><span>DIRECT ROUTE RATE</span><b class="trend up">↗ 4.2%</b></div><strong>94.7<small>%</small></strong><p>12,842 of 13,561 turns</p></article>
          <article><div><span>MEDIAN LATENCY</span><b class="trend up">↓ 38ms</b></div><strong>482<small>ms</small></strong><p>Audio in → first audio out</p></article>
          <article><div><span>TURN SUCCESS</span><b class="trend up">↗ 0.6%</b></div><strong>99.2<small>%</small></strong><p>Completed without interruption</p></article>
          <article><div><span>FALLBACKS TODAY</span><b class="trend neutral">719 turns</b></div><strong>5.3<small>%</small></strong><p>Noise is the leading trigger</p></article>
        </section>

        <section class="operations-grid">
          <article class="console-card panel">
            <div class="panel-head"><div><span>SIMULATED TURN CONSOLE</span><strong>{{ recording ? 'Generating representative signal' : processing ? 'Generating route evidence' : 'Ready for simulated input' }}</strong></div><div class="live-state" :class="{ active: recording }"><i />{{ recording ? 'SIMULATING' : 'STANDBY' }}</div></div>
            <div class="console-body">
              <button class="record-orb" :class="{ recording, processing }" :aria-label="recording ? 'Stop simulated turn' : 'Start simulated turn'" @click="toggleRecording"><span>{{ recording ? '■' : processing ? '···' : '▶' }}</span></button>
              <div class="waveform" :class="{ recording }" aria-hidden="true"><i v-for="(level, index) in waveLevels" :key="index" :style="{ height: `${recording ? level : Math.max(12, level * 0.34)}%` }" /></div>
              <div class="duration"><strong>{{ elapsed }}</strong><span>TURN LENGTH</span></div>
            </div>
            <div class="signal-strip">
              <div><span>SAMPLE FORMAT</span><strong>PCM16 · 24 kHz</strong></div><div><span>ENERGY</span><strong>{{ recording ? '−18.4 dB' : '—' }}</strong></div><div><span>PITCH</span><strong>{{ recording ? 'Elevated' : '—' }}</strong></div><div><span>END-OF-TURN</span><strong>{{ recording ? 'Simulating' : 'Semantic' }}</strong></div>
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
            <dl><div><dt>Primary model</dt><dd>{{ selectedModel }}</dd></div><div><dt>Fallback threshold</dt><dd>Confidence &lt; {{ fallbackThreshold.toFixed(2) }}</dd></div><div><dt>Shadow transcript</dt><dd><button class="mini-toggle" :class="{ on: shadowTranscripts }" @click="shadowTranscripts = !shadowTranscripts"><i /></button></dd></div></dl>
          </article>
        </section>

        <section class="turns-panel panel">
          <div class="panel-head"><div><span>RECENT VOICE TURNS</span><strong>Representative turn history</strong></div><button class="text-button" @click="activeView = 'sessions'">View all sessions ↗</button></div>
          <div class="table-wrap"><table><thead><tr><th>Turn</th><th>Time</th><th>Route</th><th>Signal</th><th>Model</th><th>Latency</th><th>Status</th></tr></thead><tbody><tr v-for="turn in recentTurns.slice(0, 4)" :key="turn.id" tabindex="0" @click="showTurn(turn)" @keydown.enter="showTurn(turn)" @keydown.space.prevent="showTurn(turn)"><td><strong>{{ turn.id }}</strong><small>{{ turn.duration }}</small></td><td>{{ turn.time }}</td><td><span class="route-pill" :class="turn.route.toLowerCase()">{{ turn.route }}</span></td><td>{{ turn.signal }}</td><td>{{ turn.model }}</td><td>{{ turn.latency }}</td><td><span class="status-pill" :class="turn.status.toLowerCase()"><i />{{ turn.status }}</span></td></tr></tbody></table></div>
        </section>
      </template>

      <template v-else-if="activeView === 'notifications'">
        <section class="registry-intro notification-intro panel">
          <div><span>AI-ASSISTED TRIAGE / REPRESENTATIVE</span><h2>See the signal. Approve the correction.</h2><p>Review operational notices, ask for a bounded diagnosis when assistance is useful, and keep a human decision between every suggestion and change.</p></div>
          <button class="session-button" @click="setNotificationFilter('open')">{{ openNotificationCount }} open notices</button>
        </section>

        <section class="notification-stats" aria-label="Notification summary">
          <article><span>OPEN</span><strong>{{ openNotificationCount }}</strong><p>Waiting for operator review</p></article>
          <article><span>NEEDS ASSISTANCE</span><strong>{{ assistanceNotificationCount }}</strong><p>Assistant analysis is available</p></article>
          <article><span>RESOLVED</span><strong>{{ resolvedNotificationCount }}</strong><p>Resolution evidence retained locally</p></article>
        </section>

        <section class="notification-layout">
          <article class="notification-inbox panel" aria-label="Notification inbox">
            <header>
              <div><span>NOTIFICATION INBOX</span><strong>{{ visibleNotifications.length }} visible</strong></div>
              <div class="notification-filters" role="group" aria-label="Filter notifications">
                <button v-for="filter in notificationFilters" :key="filter.id" :class="{ active: notificationFilter === filter.id }" :aria-pressed="notificationFilter === filter.id" @click="setNotificationFilter(filter.id)">{{ filter.label }}</button>
              </div>
            </header>
            <div class="notification-list">
              <button v-for="item in visibleNotifications" :key="item.id" class="notification-row" :class="[{ selected: selectedNotification?.id === item.id }, item.severity]" @click="selectedNotificationId = item.id">
                <i aria-hidden="true" />
                <div>
                  <span>{{ item.category }} · {{ item.time }}</span>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.summary }}</p>
                  <small v-if="item.requiresAssistance && item.status === 'open'">AI assistance available</small>
                  <small v-else>{{ item.status }}</small>
                </div>
              </button>
              <p v-if="!visibleNotifications.length" class="empty">No notifications match this filter.</p>
            </div>
          </article>

          <article v-if="selectedNotification" class="notification-detail panel" aria-live="polite">
            <header>
              <span class="severity-label" :class="selectedNotification.severity">{{ selectedNotification.severity }}</span>
              <span class="notification-status" :class="selectedNotification.status">{{ selectedNotification.status }}</span>
            </header>
            <div class="notification-detail-body">
              <span class="notification-id">{{ selectedNotification.id }}</span>
              <h2>{{ selectedNotification.title }}</h2>
              <p>{{ selectedNotification.summary }}</p>
              <dl>
                <div><dt>Source</dt><dd>{{ selectedNotification.source }}</dd></div>
                <div><dt>Category</dt><dd>{{ selectedNotification.category }}</dd></div>
                <div><dt>Observed</dt><dd>{{ selectedNotification.time }}</dd></div>
                <div><dt>Related turn</dt><dd>{{ selectedNotification.relatedTurnId ?? 'None' }}</dd></div>
              </dl>

              <section class="assistant-workspace" aria-label="AI correction assistant">
                <header><div><span>AI CORRECTION ASSISTANT</span><strong>Representative analysis</strong></div><b>HUMAN APPROVAL REQUIRED</b></header>

                <div v-if="selectedNotification.status === 'resolved'" class="resolution-card">
                  <span>RESOLUTION RECORDED</span>
                  <p>{{ selectedNotification.resolution }}</p>
                </div>

                <div v-else-if="assistantWorkingId === selectedNotification.id" class="assistant-progress" role="status">
                  <i /><div><strong>Analyzing evidence and policy constraints…</strong><p>Comparing the alert with the representative route and workspace configuration.</p></div>
                </div>

                <div v-else-if="assistantReady" class="assistant-answer">
                  <span>DIAGNOSIS</span>
                  <p>{{ selectedNotification.diagnosis }}</p>
                  <span>CORRECTION PLAN</span>
                  <ol><li v-for="step in selectedNotification.assistantPlan" :key="step">{{ step }}</li></ol>
                  <div class="assistant-suggestion"><span>SUGGESTED CHANGE</span><strong>{{ selectedNotification.suggestedAction }}</strong></div>
                  <button class="assistant-apply" @click="applyAssistantCorrection">Approve and apply correction →</button>
                  <small>This updates representative dashboard state only. Persisted production changes would require a protected backend workflow.</small>
                </div>

                <div v-else-if="selectedNotification.requiresAssistance" class="assistant-prompt">
                  <p>Ask the assistant to explain the evidence, identify the safest bounded correction, and prepare it for your approval.</p>
                  <button @click="requestAssistantReview">Ask AI assistant →</button>
                </div>

                <div v-else class="assistant-prompt">
                  <p>This informational notice does not require AI assistance or a configuration change.</p>
                </div>
              </section>
            </div>
            <footer>
              <button v-if="selectedNotification.status === 'open'" @click="resolveNotification">Mark resolved manually</button>
              <button v-else @click="reopenNotification">Reopen notification</button>
              <button v-if="selectedNotification.relatedTurnId" class="primary" @click="viewNotificationTurn">View related turn →</button>
            </footer>
          </article>
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
        <section class="registry-intro panel"><div><span>CAPABILITY REGISTRY / REPRESENTATIVE</span><h2>One interface. Every audio model.</h2><p>Explore how codec, latency, and fallback capability negotiation will work before a voice turn begins.</p></div><button class="session-button" disabled>Provider setup planned</button></section>
        <section class="model-grid"><article v-for="modelItem in models" :key="modelItem.name" class="model-card panel" :class="{ selected: selectedModel === modelItem.name }" @click="selectedModel = modelItem.name"><div class="model-top"><span>{{ modelItem.provider }}</span><b><i />{{ modelItem.status }}</b></div><h3>{{ modelItem.name }}</h3><p>{{ modelItem.codecs }}</p><div class="quality"><span>PERCEPTION SCORE</span><strong>{{ modelItem.quality }}</strong><i><b :style="{ width: `${modelItem.quality}%` }" /></i></div><dl><div><dt>Median latency</dt><dd>{{ modelItem.latency }}</dd></div><div><dt>Streaming</dt><dd>Full duplex</dd></div></dl><button>{{ selectedModel === modelItem.name ? 'Active primary' : 'Set as primary' }}</button></article></section>
      </template>

      <template v-else-if="activeView === 'evals'">
        <section class="registry-intro panel"><div><span>AUDIO-NATIVE EVALUATION / REPRESENTATIVE</span><h2>Measure what transcripts miss.</h2><p>Preview direct-versus-cascaded evidence across representative acoustic conditions.</p></div><button class="session-button" disabled>Runner planned</button></section>
        <section class="eval-grid"><article v-for="suite in evaluationSuites" :key="suite.title" class="eval-card panel"><div><span>{{ suite.title }}</span><b>{{ suite.change }}</b></div><strong>{{ suite.score }}<small>/100</small></strong><div class="eval-bar"><i :style="{ width: `${suite.score}%` }" /></div><p>{{ suite.runs }} paired test runs</p></article></section>
        <section class="comparison panel"><div class="panel-head"><div><span>DIRECT VS CASCADED</span><strong>Perception advantage by signal</strong></div><small>Last 7 days</small></div><div class="comparison-chart"><div v-for="(suite, index) in evaluationSuites" :key="suite.title"><span>{{ suite.title }}</span><i><b :style="{ width: `${72 + index * 6}%` }" /><em :style="{ width: `${48 + index * 4}%` }" /></i><strong>+{{ 18 - index * 2 }} pts</strong></div></div><footer><span><i class="direct-key" /> Direct audio</span><span><i class="base-key" /> STT baseline</span></footer></section>
      </template>

      <template v-else-if="activeView === 'controls'">
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

.simulation-banner {
  min-height: 64px;
  margin-top: 18px;
  border: 1px solid #79d8ff3d;
  background: linear-gradient(90deg, #79d8ff0d, transparent);
  padding: 12px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.simulation-banner span,
.simulation-banner strong {
  display: block;
}

.simulation-banner span {
  color: #79d8ff;
  letter-spacing: .13em;
  font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace;
  margin-bottom: 5px;
}

.simulation-banner strong {
  color: #a8b4aa;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.55;
}

.simulation-banner a {
  color: #79d8ff;
  white-space: nowrap;
  font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase;
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

.onboarding {
  margin-top: 18px;
  overflow: hidden;
}

.onboarding > header {
  min-height: 82px;
  border-bottom: 1px solid var(--d-line);
  padding: 17px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.onboarding > header span {
  color: var(--d-lime);
  letter-spacing: .14em;
  font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.onboarding h2 {
  font-size: 21px;
  font-weight: 500;
  letter-spacing: -.03em;
  margin: 8px 0 0;
}

.onboarding > header button {
  color: #687368;
  cursor: pointer;
  font-size: 20px;
}

.onboarding ol {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
}

.onboarding li {
  min-height: 128px;
  border-right: 1px solid var(--d-line);
  padding: 20px;
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 12px;
}

.onboarding li:last-child {
  border-right: 0;
}

.onboarding li > span {
  color: #596359;
  font: 700 9px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.onboarding li strong {
  display: block;
  font-size: 11px;
}

.onboarding li p {
  color: #6f7a6e;
  font-size: 9px;
  line-height: 1.6;
  margin: 8px 0 0;
}

.onboarding li.active {
  background: #c6ff4a08;
}

.onboarding li.active > span,
.onboarding li.complete > span {
  color: var(--d-lime);
}

.onboarding li.complete strong {
  color: #8f9b8d;
}

.onboarding > footer {
  min-height: 66px;
  border-top: 1px solid var(--d-line);
  padding: 13px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.onboarding > footer p {
  color: #6f7a6e;
  font-size: 9px;
  line-height: 1.6;
  margin: 0;
}

.onboarding > footer button,
.onboarding > footer a {
  background: var(--d-lime);
  color: #11170b;
  cursor: pointer;
  padding: 11px 13px;
  white-space: nowrap;
  text-transform: uppercase;
  font: 800 8px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.dashboard tbody tr:focus-visible {
  outline: 2px solid var(--d-lime);
  outline-offset: -2px;
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

.registry-intro .session-button:disabled {
  background: #283027;
  color: #7e887c;
  cursor: not-allowed;
}

.icon-button.active {
  border-color: #c6ff4a70;
  color: var(--d-lime);
  background: #c6ff4a0a;
}

.notification-intro .session-button {
  white-space: nowrap;
}

.notification-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 18px;
  border-left: 1px solid var(--d-line);
}

.notification-stats article {
  border: 1px solid var(--d-line);
  border-left: 0;
  background: var(--d-panel-2);
  padding: 18px 20px;
}

.notification-stats span,
.notification-id,
.assistant-workspace span {
  color: #697469;
  letter-spacing: .13em;
  font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.notification-stats strong {
  display: block;
  margin: 15px 0 7px;
  font: 400 28px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.notification-stats p {
  color: #6f796e;
  font-size: 9px;
  margin: 0;
}

.notification-layout {
  display: grid;
  grid-template-columns: minmax(330px, .8fr) minmax(420px, 1.2fr);
  gap: 18px;
  margin-top: 18px;
}

.notification-inbox,
.notification-detail {
  min-width: 0;
  align-self: start;
}

.notification-inbox > header {
  min-height: 76px;
  border-bottom: 1px solid var(--d-line);
  padding: 14px 17px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.notification-inbox > header span,
.notification-inbox > header strong {
  display: block;
}

.notification-inbox > header span {
  color: #697469;
  letter-spacing: .13em;
  font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace;
  margin-bottom: 6px;
}

.notification-inbox > header strong {
  font-size: 12px;
}

.notification-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
}

.notification-filters button {
  border: 1px solid var(--d-line);
  color: #778176;
  padding: 6px 7px;
  cursor: pointer;
  font: 700 7px ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase;
}

.notification-filters button.active {
  border-color: #c6ff4a50;
  color: var(--d-lime);
  background: #c6ff4a0a;
}

.notification-list {
  padding: 7px;
}

.notification-row {
  width: 100%;
  border: 1px solid transparent;
  border-bottom-color: var(--d-line);
  padding: 16px 14px;
  display: grid;
  grid-template-columns: 7px 1fr;
  gap: 13px;
  text-align: left;
  cursor: pointer;
}

.notification-row:hover,
.notification-row.selected {
  background: #ffffff04;
}

.notification-row.selected {
  border-color: #c6ff4a38;
}

.notification-row > i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #79d8ff;
  margin-top: 4px;
}

.notification-row.warning > i {
  background: #f2cf6d;
  box-shadow: 0 0 10px #f2cf6d55;
}

.notification-row.critical > i {
  background: #ff8066;
  box-shadow: 0 0 10px #ff806655;
}

.notification-row span,
.notification-row strong,
.notification-row small {
  display: block;
}

.notification-row span {
  color: #697469;
  text-transform: uppercase;
  font: 700 7px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: .09em;
}

.notification-row strong {
  color: var(--d-ink);
  font-size: 12px;
  line-height: 1.35;
  margin-top: 7px;
}

.notification-row p {
  color: #778176;
  font-size: 9px;
  line-height: 1.55;
  margin: 7px 0 9px;
}

.notification-row small {
  color: var(--d-lime);
  font: 700 7px ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase;
}

.notification-detail > header {
  min-height: 54px;
  border-bottom: 1px solid var(--d-line);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.severity-label,
.notification-status {
  border: 1px solid var(--d-line);
  padding: 6px 8px;
  text-transform: uppercase;
  letter-spacing: .1em;
  font: 700 7px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.severity-label.warning {
  color: #f2cf6d;
  border-color: #f2cf6d45;
}

.severity-label.critical {
  color: #ff9b86;
  border-color: #ff806645;
}

.severity-label.info {
  color: #79d8ff;
  border-color: #79d8ff45;
}

.notification-status.open {
  color: #f2cf6d;
}

.notification-status.resolved {
  color: var(--d-lime);
}

.notification-detail-body {
  padding: 25px;
}

.notification-detail h2 {
  max-width: 650px;
  font-size: 27px;
  font-weight: 500;
  letter-spacing: -.035em;
  line-height: 1.12;
  margin: 11px 0 12px;
}

.notification-detail-body > p {
  color: #899488;
  font-size: 11px;
  line-height: 1.7;
  margin: 0;
}

.notification-detail dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid var(--d-line);
  margin: 22px 0;
}

.notification-detail dl div {
  border-right: 1px solid var(--d-line);
  border-bottom: 1px solid var(--d-line);
  padding: 12px;
}

.notification-detail dl div:nth-child(2n) {
  border-right: 0;
}

.notification-detail dl div:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.notification-detail dt {
  color: #687368;
  font: 700 7px ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase;
}

.notification-detail dd {
  color: #a9b2a7;
  font-size: 9px;
  margin: 7px 0 0;
}

.assistant-workspace {
  border: 1px solid #79d8ff35;
  background: linear-gradient(145deg, #79d8ff09, transparent 72%);
}

.assistant-workspace > header {
  min-height: 62px;
  border-bottom: 1px solid #79d8ff26;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.assistant-workspace > header span,
.assistant-workspace > header strong {
  display: block;
}

.assistant-workspace > header span {
  color: #79d8ff;
}

.assistant-workspace > header strong {
  font-size: 10px;
  margin-top: 5px;
}

.assistant-workspace > header b {
  color: #f2cf6d;
  font: 700 7px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: .09em;
}

.assistant-prompt,
.assistant-progress,
.assistant-answer,
.resolution-card {
  padding: 18px;
}

.assistant-prompt p,
.assistant-progress p,
.assistant-answer p,
.resolution-card p {
  color: #8c978b;
  font-size: 10px;
  line-height: 1.65;
  margin: 0;
}

.assistant-prompt button,
.assistant-apply {
  background: #79d8ff;
  color: #071014;
  padding: 10px 12px;
  margin-top: 15px;
  cursor: pointer;
  font: 800 8px ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase;
}

.assistant-progress {
  display: flex;
  align-items: center;
  gap: 14px;
}

.assistant-progress > i {
  width: 18px;
  height: 18px;
  border: 2px solid #79d8ff35;
  border-top-color: #79d8ff;
  border-radius: 50%;
  animation: assistantSpin .8s linear infinite;
}

.assistant-progress strong {
  display: block;
  font-size: 10px;
  margin-bottom: 4px;
}

.assistant-answer > span,
.resolution-card > span {
  color: #79d8ff;
  display: block;
  margin-bottom: 8px;
}

.assistant-answer ol {
  color: #a3ada1;
  margin: 9px 0 18px;
  padding-left: 19px;
  font-size: 9px;
  line-height: 1.7;
}

.assistant-suggestion {
  border-left: 2px solid #79d8ff;
  background: #79d8ff08;
  padding: 12px 14px;
}

.assistant-suggestion span,
.assistant-suggestion strong {
  display: block;
}

.assistant-suggestion strong {
  font-size: 10px;
  line-height: 1.55;
  margin-top: 7px;
}

.assistant-answer > small {
  color: #687368;
  display: block;
  font-size: 8px;
  line-height: 1.5;
  margin-top: 10px;
}

.resolution-card > span {
  color: var(--d-lime);
}

.notification-detail > footer {
  min-height: 60px;
  border-top: 1px solid var(--d-line);
  padding: 11px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
}

.notification-detail > footer button {
  border: 1px solid var(--d-line);
  color: #899488;
  padding: 9px 11px;
  cursor: pointer;
  font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase;
}

.notification-detail > footer button.primary {
  border-color: #c6ff4a50;
  color: var(--d-lime);
}

.notification-row:focus-visible,
.notification-filters button:focus-visible,
.assistant-workspace button:focus-visible,
.notification-detail > footer button:focus-visible {
  outline: 2px solid var(--d-lime);
  outline-offset: 2px;
}

@keyframes assistantSpin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .simulation-banner,
  .demo-banner {
    align-items: flex-start;
    flex-direction: column;
  }

  .onboarding ol {
    grid-template-columns: 1fr;
  }

  .onboarding li {
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--d-line);
  }

  .onboarding > footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .notification-stats,
  .notification-layout {
    grid-template-columns: 1fr;
  }

  .notification-inbox > header,
  .assistant-workspace > header {
    align-items: flex-start;
    flex-direction: column;
  }

  .notification-filters {
    justify-content: flex-start;
  }

  .notification-detail-body {
    padding: 18px;
  }

  .notification-detail h2 {
    font-size: 23px;
  }

  .notification-detail > footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
