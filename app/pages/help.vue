<script setup lang="ts">
type HelpStep = {
  title: string
  body: string
  note?: string
}

type HelpGuide = {
  id: string
  category: 'start' | 'operate' | 'evaluate' | 'privacy' | 'admin' | 'troubleshoot'
  eyebrow: string
  title: string
  summary: string
  time: string
  audience: string
  steps: HelpStep[]
  checks: string[]
  related?: { label: string; to: string }[]
}

const categories = [
  { id: 'all', label: 'All guides', hint: '11' },
  { id: 'start', label: 'Getting started', hint: '02' },
  { id: 'operate', label: 'Operate', hint: '03' },
  { id: 'evaluate', label: 'Evaluate', hint: '02' },
  { id: 'privacy', label: 'Privacy', hint: '01' },
  { id: 'admin', label: 'Administration', hint: '01' },
  { id: 'troubleshoot', label: 'Troubleshooting', hint: '02' },
] as const

const guides: HelpGuide[] = [
  {
    id: 'understand-the-demo',
    category: 'start',
    eyebrow: 'BEFORE YOU BEGIN',
    title: 'Understand what the current demo does',
    summary: 'Know which dashboard behaviors are simulated, which records persist, and what changes when you use a registered account.',
    time: '2 min',
    audience: 'Everyone',
    steps: [
      { title: 'Treat the waveform as a product simulation', body: 'Start live turn animates the console and creates representative routing, latency, transcript, and acoustic-signal data. The current application does not request microphone access or send audio to an AI provider.' },
      { title: 'Choose the right identity', body: 'Demo access is a safe sandbox: generated turns stay in browser memory and disappear on refresh. User and admin accounts persist generated turn metadata and policy settings in Supabase.' },
      { title: 'Use the dashboard to validate the workflow', body: 'Test the operational experience—routing, session inspection, model selection, evaluations, and data policy—before connecting production audio infrastructure.' },
    ],
    checks: ['No microphone permission is expected', 'Demo data is temporary', 'Production providers are not connected'],
    related: [{ label: 'Read the privacy policy', to: '/privacy#audio' }, { label: 'Open the dashboard', to: '/dashboard' }],
  },
  {
    id: 'first-voice-turn',
    category: 'start',
    eyebrow: 'QUICKSTART',
    title: 'Run your first simulated voice turn',
    summary: 'Create a representative voice turn, watch the route decision, and inspect the result in Sessions.',
    time: '3 min',
    audience: 'Demo · User · Admin',
    steps: [
      { title: 'Open Live overview', body: 'Sign in, open the dashboard, and select Live overview in the left navigation. Confirm that the console says Ready for input.' },
      { title: 'Choose a route', body: 'In Active route, choose Adaptive for the normal dual-path behavior, Direct to keep the audio-native path, or Standard to simulate STT + LLM.' },
      { title: 'Start and end the turn', body: 'Select Start live turn. Let the waveform run for a few seconds, then select End turn. The interface processes the simulated turn for about a second.' },
      { title: 'Inspect the result', body: 'The new row appears under Recent voice turns. Select it to open Sessions, where you can review route, model, latency, duration, signal, status, and the optional shadow transcript.' },
    ],
    checks: ['A new turn appears', 'Route matches the selected mode', 'Latency and status are visible'],
    related: [{ label: 'Open Live overview', to: '/dashboard' }],
  },
  {
    id: 'choose-routing-mode',
    category: 'operate',
    eyebrow: 'HOW TO',
    title: 'Choose Adaptive, Direct, or Standard routing',
    summary: 'Use the route controls deliberately and understand the tradeoff represented by each mode.',
    time: '4 min',
    audience: 'User · Admin',
    steps: [
      { title: 'Use Adaptive as the deployment default', body: 'Adaptive represents a route gate that can select direct audio when the model and signal are suitable, then fall back when confidence or capability is insufficient.' },
      { title: 'Use Direct for controlled comparisons', body: 'Direct sends the representative turn to the selected audio model. Use it when testing the value of pitch, cadence, energy, emphasis, laughter, or other information that a transcript can flatten.' },
      { title: 'Use Standard as the baseline', body: 'Standard represents the cascaded STT + LLM path. Compare it with Direct to measure the operational and perception difference instead of assuming one path is always better.' },
      { title: 'Keep shadow transcripts optional', body: 'The Shadow transcript switch generates text beside the direct path for captions and debugging; it does not make text the simulated model input.' },
    ],
    checks: ['Adaptive is the normal default', 'Standard is labeled fallback', 'Shadow transcript state is intentional'],
    related: [{ label: 'Review the architecture', to: '/#architecture' }, { label: 'Open Data controls', to: '/dashboard' }],
  },
  {
    id: 'investigate-turns',
    category: 'operate',
    eyebrow: 'HOW TO',
    title: 'Investigate a slow or fallback turn',
    summary: 'Use Sessions to isolate a turn, read its evidence, and decide whether routing, model capability, or signal quality needs attention.',
    time: '5 min',
    audience: 'User · Admin',
    steps: [
      { title: 'Open Sessions', body: 'Choose Sessions from the dashboard navigation, or select a row in Recent voice turns to jump directly to that turn.' },
      { title: 'Search with the strongest identifier', body: 'Search by turn ID first. You can also search visible values such as model, signal, route, or status.' },
      { title: 'Read route and latency together', body: 'A fallback is not automatically a failure. Confirm whether Standard routing was intentionally selected, then compare model, signal, latency, duration, and status.' },
      { title: 'Check the wider session', body: 'Use Session health, P95 latency, average duration, and barge-ins to decide whether the issue is isolated or part of a broader pattern.' },
      { title: 'Reproduce with a paired test', body: 'Run the same representative condition through Direct and Standard, then compare the outcome in Audio evals.' },
    ],
    checks: ['Turn ID is captured', 'Route decision is explained', 'Comparison uses the same condition'],
    related: [{ label: 'Open Sessions', to: '/dashboard' }],
  },
  {
    id: 'select-primary-model',
    category: 'operate',
    eyebrow: 'HOW TO',
    title: 'Select the primary audio model',
    summary: 'Compare registered model capabilities and change the model represented by direct turns.',
    time: '3 min',
    audience: 'User · Admin',
    steps: [
      { title: 'Open Model registry', body: 'Each card shows provider role, supported codecs, perception score, median latency, streaming mode, and readiness.' },
      { title: 'Compare capability before score', body: 'Confirm codec and streaming compatibility first. A higher perception score is useful only when the model can accept the application’s actual audio format and timing requirements.' },
      { title: 'Set the primary', body: 'Select a model card. The card becomes active and new Direct or Adaptive demo turns use that model name.' },
      { title: 'Plan a fallback', body: 'Keep at least one compatible secondary or fallback model. Production routing should evaluate capability, availability, latency, language, duration, and confidence before invocation.' },
    ],
    checks: ['Codec is compatible', 'Latency fits the target', 'A fallback remains available'],
    related: [{ label: 'Open Model registry', to: '/dashboard' }],
  },
  {
    id: 'compare-audio-paths',
    category: 'evaluate',
    eyebrow: 'HOW TO',
    title: 'Compare direct audio with the cascaded baseline',
    summary: 'Use paired evaluations to measure what the audio-native route preserves rather than relying on anecdotal demos.',
    time: '6 min',
    audience: 'User · Admin',
    steps: [
      { title: 'Choose a signal-specific suite', body: 'Start with Pitch + emphasis, Accents + dialects, Noise resilience, or Turn boundaries. Each suite should isolate one meaningful acoustic condition.' },
      { title: 'Keep the test pair equivalent', body: 'Replay the same consented source condition through Direct and the STT baseline. Keep prompts, model versions, output settings, and scoring criteria stable.' },
      { title: 'Read score and sample size together', body: 'A high score with too few runs is weak evidence. Review the paired run count and trend before treating a difference as a regression gate.' },
      { title: 'Promote only repeatable gains', body: 'Use a direct route where it improves perception or timing without unacceptable safety, cost, or reliability regressions.' },
    ],
    checks: ['Input condition is paired', 'Sample count is adequate', 'Safety and latency remain acceptable'],
    related: [{ label: 'Open Audio evals', to: '/dashboard' }, { label: 'Read evaluation lessons', to: '/#roadmap' }],
  },
  {
    id: 'configure-data-policy',
    category: 'privacy',
    eyebrow: 'HOW TO',
    title: 'Configure the acoustic data policy',
    summary: 'Control shadow transcripts, consent-aware logging, acoustic signals, and raw-audio retention as one versioned policy.',
    time: '5 min',
    audience: 'User · Admin',
    steps: [
      { title: 'Open Data controls', body: 'Review the active policy before changing individual switches. Demo users can explore the controls, but Save policy remains disabled.' },
      { title: 'Decide whether text is needed', body: 'Enable Shadow transcripts only when captions, search, debugging, or auditing justify the additional text artifact.' },
      { title: 'Require consent for traces', body: 'Keep Consent-aware logging enabled so a production implementation can reject storage when the client has not supplied a valid consent state.' },
      { title: 'Minimize derived signals', body: 'Expose acoustic signals only when the application needs them. Avoid sensitive-trait inference and document every downstream consumer.' },
      { title: 'Choose the shortest useful retention', body: 'Use Transient only when replay is unnecessary. Otherwise choose 1 hour, 24 hours, or 7 days based on a documented operational need, then select Save policy.' },
    ],
    checks: ['Consent basis is documented', 'Retention is minimized', 'Policy saved confirmation appears'],
    related: [{ label: 'Read the privacy policy', to: '/privacy' }, { label: 'Open Data controls', to: '/dashboard' }],
  },
  {
    id: 'manage-access',
    category: 'admin',
    eyebrow: 'ADMIN HOW TO',
    title: 'Review users and role boundaries',
    summary: 'Use the administration view to audit demo, user, and admin access without confusing authentication with authorization.',
    time: '4 min',
    audience: 'Admin',
    steps: [
      { title: 'Open Administration', body: 'Admin accounts see an Administration link in the dashboard sidebar. The route is protected in the client and the server checks the role again.' },
      { title: 'Review the identity directory', body: 'Confirm each person’s workspace, role, status, and last activity. Investigate unexpected administrators immediately.' },
      { title: 'Use the role matrix', body: 'Demo can explore the sandbox, User can operate a workspace, and Admin can manage identities and global controls. Grant the least privilege needed.' },
      { title: 'Check recent audit activity', body: 'Review sign-ins and role-related events for unexpected actors, scopes, or results. Production deployments should add MFA, durable audit retention, alerting, and an incident process.' },
    ],
    checks: ['Admin access is justified', 'Workspace boundary is correct', 'Unexpected activity is investigated'],
    related: [{ label: 'Open Administration', to: '/admin' }, { label: 'Review account terms', to: '/terms#accounts' }],
  },
  {
    id: 'fix-sign-in',
    category: 'troubleshoot',
    eyebrow: 'TROUBLESHOOT',
    title: 'Fix sign-in or access problems',
    summary: 'Work from the session boundary inward when login succeeds but a protected page does not open.',
    time: '5 min',
    audience: 'Everyone',
    steps: [
      { title: 'Confirm the account type', body: 'Use Demo for the sandbox or the matching registered User/Admin account. An authenticated user still needs the required role for protected routes.' },
      { title: 'Retry with a fresh session', body: 'Sign out, return to Sign in, and authenticate again. Sessions are time-limited and use same-site Supabase cookies.' },
      { title: 'Check browser cookie restrictions', body: 'Strict privacy extensions or blocked site storage can prevent the authentication cookie from being retained. Allow essential storage for this site, then retry.' },
      { title: 'Verify deployment configuration', body: 'For operators, confirm SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set in the hosting environment. Never place a secret or service-role key in public Nuxt configuration.' },
      { title: 'Check role and membership', body: 'If sign-in works but Administration does not, verify the profile role and workspace membership in Supabase rather than bypassing the route guard.' },
    ],
    checks: ['Essential cookies are allowed', 'Public Supabase configuration is present', 'Role matches the requested route'],
    related: [{ label: 'Go to Sign in', to: '/login' }, { label: 'Review cookie details', to: '/privacy#cookies' }],
  },
  {
    id: 'fix-turns-and-policies',
    category: 'troubleshoot',
    eyebrow: 'TROUBLESHOOT',
    title: 'Fix missing turns or policies that will not save',
    summary: 'Separate expected demo behavior from persistence, permission, and row-level security failures.',
    time: '5 min',
    audience: 'Demo · User · Admin',
    steps: [
      { title: 'Identify the current role', body: 'Demo turns intentionally remain in browser memory and disappear after refresh. Demo policy changes are exploratory and the Save policy button is disabled.' },
      { title: 'Read the visible error state', body: 'If a registered turn completes but persistence fails, the dashboard shows a message above the content. If policy saving fails, the status changes to Unable to save policy.' },
      { title: 'Confirm the authenticated workspace', body: 'Registered records are scoped to the signed-in user and workspace. A missing membership or mismatched organization ID should fail closed.' },
      { title: 'Check Supabase migrations and RLS', body: 'Operators should confirm the current schema is applied and row-level security policies allow the intended user operation without granting cross-workspace access.' },
      { title: 'Retry one small operation', body: 'After correcting configuration or membership, create one short turn or change one policy setting. Confirm success before attempting bulk tests.' },
    ],
    checks: ['Behavior matches the role', 'RLS remains enabled', 'A single retry persists successfully'],
    related: [{ label: 'Open the dashboard', to: '/dashboard' }, { label: 'Review project issues', to: '/#roadmap' }],
  },
  {
    id: 'production-readiness',
    category: 'evaluate',
    eyebrow: 'LAUNCH CHECKLIST',
    title: 'Move from product demo to production',
    summary: 'Use a staged readiness gate before connecting real microphones, model providers, billing, and customer traffic.',
    time: '8 min',
    audience: 'Builder · Admin',
    steps: [
      { title: 'Connect one audio provider behind an adapter', body: 'Keep provider codecs, sample rates, languages, limits, and output modes in the capability registry instead of spreading conditionals across the application.' },
      { title: 'Implement consent before capture', body: 'Explain who processes audio, why, for how long, and whether transcripts or derived signals are created. Capture a reversible consent state before audio leaves the device.' },
      { title: 'Persist the route decision and policy snapshot', body: 'Every turn should record the selected route, reason, model invocation, timing, applicable consent, policy version, and retained artifacts.' },
      { title: 'Gate releases with paired evaluations', body: 'Test accents, noise, pitch, interruptions, multilingual turns, safety, latency, and fallback recovery using consented representative data.' },
      { title: 'Complete the operational controls', body: 'Add rate limiting, MFA for admins, monitoring, backups, deletion workflows, incident response, vendor agreements, usage metering, and reviewed production legal documents.' },
    ],
    checks: ['Consent precedes capture', 'Fallback is tested', 'Policies travel with each turn', 'Legal and security reviews are complete'],
    related: [{ label: 'Read the roadmap', to: '/#roadmap' }, { label: 'Review Terms', to: '/terms' }],
  },
]

const query = ref('')
const activeCategory = ref<(typeof categories)[number]['id']>('all')
const selectedGuideId = ref(guides[0]?.id ?? '')

const visibleGuides = computed(() => {
  const normalized = query.value.trim().toLowerCase()
  return guides.filter((guide) => {
    const categoryMatches = activeCategory.value === 'all' || guide.category === activeCategory.value
    if (!categoryMatches) return false
    if (!normalized) return true
    const searchable = [
      guide.eyebrow,
      guide.title,
      guide.summary,
      guide.audience,
      ...guide.steps.flatMap(step => [step.title, step.body, step.note ?? '']),
      ...guide.checks,
    ].join(' ').toLowerCase()
    return searchable.includes(normalized)
  })
})

function categoryName(id: HelpGuide['category']) {
  return categories.find(category => category.id === id)?.label ?? id
}

function selectGuide(id: string) {
  selectedGuideId.value = selectedGuideId.value === id ? '' : id
}

function choosePath(category: typeof activeCategory.value, guideId: string) {
  activeCategory.value = category
  query.value = ''
  selectedGuideId.value = guideId
  nextTick(() => document.getElementById(guideId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

watch(visibleGuides, (nextGuides) => {
  if (nextGuides.length && !nextGuides.some(guide => guide.id === selectedGuideId.value)) selectedGuideId.value = nextGuides[0]!.id
})

useHead({
  title: 'Help Center · Listen Direct',
  meta: [{ name: 'description', content: 'Detailed setup, operations, evaluation, privacy, administration, and troubleshooting guides for Listen Direct.' }],
  link: [{ rel: 'icon', href: '/favicon.svg' }],
})
</script>

<template>
  <main class="help-page">
    <nav class="help-nav" aria-label="Help navigation">
      <NuxtLink class="help-brand" to="/" aria-label="Listen Direct home"><span><i /><i /><i /></span>LISTEN<strong>/DIRECT</strong></NuxtLink>
      <div><NuxtLink to="/">Product</NuxtLink><NuxtLink to="/privacy">Privacy</NuxtLink><NuxtLink class="help-nav-cta" to="/dashboard">Open dashboard <b>↗</b></NuxtLink></div>
    </nav>

    <header class="help-hero">
      <div class="help-hero-copy"><span><i /> PRODUCT HELP / VERSION 1.0</span><h1>Operate with<br><em>confidence.</em></h1><p>Practical guidance for exploring the demo, running voice operations, comparing audio paths, protecting data, and preparing a production deployment.</p></div>
      <label class="help-search"><span>⌕</span><input v-model="query" type="search" placeholder="Search routing, sessions, privacy…" aria-label="Search help guides"><kbd>HELP</kbd></label>
    </header>

    <section class="scope-note" aria-label="Demo scope"><strong>DEMO SCOPE</strong><p>The current dashboard simulates voice activity and does not request microphone access or call a live AI model. This Help Center distinguishes current behavior from production recommendations.</p><NuxtLink to="/help#understand-the-demo">Read first →</NuxtLink></section>

    <section class="quick-paths" aria-labelledby="quick-paths-title">
      <div class="section-label"><span>01</span><div><p>CHOOSE YOUR PATH</p><h2 id="quick-paths-title">Start with your role.</h2></div></div>
      <div class="path-grid">
        <button @click="choosePath('start', 'first-voice-turn')"><span>DEMO</span><strong>Explore safely</strong><p>Run a temporary turn and learn the operating model.</p><b>4 steps →</b></button>
        <button @click="choosePath('operate', 'choose-routing-mode')"><span>BUILDER</span><strong>Route and measure</strong><p>Compare direct listening with the reliable baseline.</p><b>3 core workflows →</b></button>
        <button @click="choosePath('admin', 'manage-access')"><span>ADMIN</span><strong>Control access</strong><p>Review roles, policies, and workspace boundaries.</p><b>Security path →</b></button>
      </div>
    </section>

    <section id="guides" class="help-library" aria-labelledby="guide-library-title">
      <aside>
        <div class="library-label"><span>02</span><p id="guide-library-title">GUIDE LIBRARY</p></div>
        <div class="category-list" role="group" aria-label="Filter guides by category">
          <button v-for="category in categories" :key="category.id" :class="{ active: activeCategory === category.id }" @click="activeCategory = category.id"><span>{{ category.label }}</span><b>{{ category.hint }}</b></button>
        </div>
        <div class="help-principle"><span>OPERATING PRINCIPLE</span><p>Preserve the signal, record the decision, minimize the footprint.</p></div>
      </aside>

      <div class="guide-results">
        <header><div><span>{{ String(visibleGuides.length).padStart(2, '0') }} GUIDES</span><h2>{{ activeCategory === 'all' ? 'All how-tos' : categories.find(item => item.id === activeCategory)?.label }}</h2></div><button v-if="query || activeCategory !== 'all'" @click="query = ''; activeCategory = 'all'">Clear filters ×</button></header>

        <div v-if="visibleGuides.length" class="guide-list">
          <article v-for="(guide, index) in visibleGuides" :id="guide.id" :key="guide.id" class="guide-card" :class="{ open: selectedGuideId === guide.id }">
            <button class="guide-trigger" :aria-expanded="selectedGuideId === guide.id" :aria-controls="`${guide.id}-content`" @click="selectGuide(guide.id)">
              <span class="guide-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="guide-title"><small>{{ guide.eyebrow }} · {{ categoryName(guide.category).toUpperCase() }}</small><strong>{{ guide.title }}</strong><p>{{ guide.summary }}</p></span>
              <span class="guide-meta"><small>{{ guide.audience }}</small><b>{{ guide.time }}</b><i>{{ selectedGuideId === guide.id ? '−' : '+' }}</i></span>
            </button>
            <div v-if="selectedGuideId === guide.id" :id="`${guide.id}-content`" class="guide-content">
              <ol>
                <li v-for="(step, stepIndex) in guide.steps" :key="step.title"><span>{{ String(stepIndex + 1).padStart(2, '0') }}</span><div><h3>{{ step.title }}</h3><p>{{ step.body }}</p><aside v-if="step.note">{{ step.note }}</aside></div></li>
              </ol>
              <div class="guide-checks"><span>SUCCESS CHECK</span><ul><li v-for="check in guide.checks" :key="check"><i />{{ check }}</li></ul></div>
              <footer v-if="guide.related?.length"><span>CONTINUE</span><div><NuxtLink v-for="link in guide.related" :key="link.to" :to="link.to">{{ link.label }} <b>↗</b></NuxtLink></div></footer>
            </div>
          </article>
        </div>
        <div v-else class="empty-guides"><span>NO MATCH</span><h3>Try a broader search.</h3><p>Search for a feature, task, role, or problem such as “routing,” “retention,” “admin,” or “sign in.”</p><button @click="query = ''; activeCategory = 'all'">Show every guide</button></div>
      </div>
    </section>

    <section class="help-glossary">
      <div class="section-label"><span>03</span><div><p>QUICK REFERENCE</p><h2>Terms you will see.</h2></div></div>
      <dl><div><dt>Direct</dt><dd>The representative audio signal goes to an audio-input model without transcription as the reasoning input.</dd></div><div><dt>Standard</dt><dd>The cascaded baseline: speech-to-text, text reasoning, then speech synthesis.</dd></div><div><dt>Adaptive</dt><dd>A route gate chooses Direct or Standard using capability, confidence, latency, and policy.</dd></div><div><dt>Shadow transcript</dt><dd>Optional text generated beside the direct path for captions, search, debugging, or audits.</dd></div><div><dt>Acoustic signals</dt><dd>Non-text features such as pitch, energy, cadence, and turn-taking behavior.</dd></div><div><dt>RLS</dt><dd>Supabase PostgreSQL row-level security that enforces workspace access at the data layer.</dd></div></dl>
    </section>

    <section class="help-cta"><div><span>READY TO TRY IT?</span><h2>Learn by operating.</h2><p>Open the protected workspace and use these guides alongside the dashboard.</p></div><div><NuxtLink class="primary" to="/dashboard">Open dashboard <b>↗</b></NuxtLink><NuxtLink to="/login">Sign in</NuxtLink></div></section>

    <footer class="help-footer"><NuxtLink class="help-brand" to="/"><span><i /><i /><i /></span>LISTEN<strong>/DIRECT</strong></NuxtLink><p>Help Center · Updated August 19, 2026</p><div><NuxtLink to="/privacy">Privacy</NuxtLink><NuxtLink to="/terms">Terms</NuxtLink><a href="#top">Top ↑</a></div></footer>
  </main>
</template>

<style scoped src="~/assets/help.css"></style>
