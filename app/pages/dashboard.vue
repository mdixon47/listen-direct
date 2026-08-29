<script setup lang="ts">
definePageMeta({ middleware: "authenticated" });

import {
  evaluationSuites,
  models,
  navigation,
  notificationFilters,
  seededNotifications,
  type AppUser,
  type DataPolicy,
  type NotificationFilter,
  type NotificationItem,
  type RouteMode,
  type Turn,
  type ViewName,
} from "~/data/dashboard";

const route = useRoute();
const isGuestDemo = computed(() => route.query.demo === "1");
const guestUser: AppUser = {
  id: "guest-demo",
  name: "Demo Explorer",
  email: "guest@local.demo",
  role: "demo",
  workspace: "Listen Direct Playground",
  organizationId: "guest-demo",
};
const guestDemoTurns: Turn[] = [
  {
    id: "demo_tone_01",
    time: "14:32:09",
    duration: "4.8s",
    route: "Direct",
    model: "Inkling Audio",
    latency: "496ms",
    signal: "Elevated pitch",
    status: "Complete",
    transcript: "Can you tell that I am asking this in a higher pitch?",
  },
  {
    id: "demo_noise_02",
    time: "14:28:41",
    duration: "6.2s",
    route: "Fallback",
    model: "STT + LLM",
    latency: "842ms",
    signal: "Background noise",
    status: "Flagged",
    transcript:
      "The representative route fell back after the confidence threshold was crossed.",
  },
];
const requestHeaders = import.meta.server
  ? useRequestHeaders(["cookie"])
  : undefined;
const identity = ref<{ user: AppUser } | null>(
  isGuestDemo.value ? { user: guestUser } : null,
);
const persistedTurns = ref<{ turns: Turn[] } | null>(null);
const persistedPolicy = ref<{ policy: DataPolicy } | null>(null);

if (!isGuestDemo.value) {
  const [identityResult, turnsResult, policyResult] = await Promise.all([
    $fetch<{ user: AppUser }>("/api/auth/me", { headers: requestHeaders }),
    $fetch<{ turns: Turn[] }>("/api/voice/turns", { headers: requestHeaders }),
    $fetch<{ policy: DataPolicy }>("/api/data-policy", {
      headers: requestHeaders,
    }),
  ]);
  identity.value = identityResult;
  persistedTurns.value = turnsResult;
  persistedPolicy.value = policyResult;
}

const recentTurns = ref<Turn[]>(
  isGuestDemo.value ? guestDemoTurns : (persistedTurns.value?.turns ?? []),
);

const requestedView =
  typeof route.query.view === "string" &&
  navigation.some((item) => item.id === route.query.view)
    ? (route.query.view as ViewName)
    : "overview";
const activeView = ref<ViewName>(requestedView);
const user = computed(() => identity.value?.user);
const routeMode = ref<RouteMode>("adaptive");
const fallbackThreshold = ref(0.72);
const selectedModel = ref("Inkling Audio");
const shadowTranscripts = ref(
  persistedPolicy.value?.policy.shadow_transcripts ?? true,
);
const consentLogging = ref(
  persistedPolicy.value?.policy.consent_logging ?? true,
);
const acousticSignals = ref(
  persistedPolicy.value?.policy.acoustic_signals ?? true,
);
const retention = ref(
  (
    {
      0: "Transient only",
      1: "1 hour",
      24: "24 hours",
      168: "7 days",
    } as Record<number, string>
  )[persistedPolicy.value?.policy.raw_audio_retention_hours ?? 24] ??
    "24 hours",
);
const policySaving = ref(false);
const policyStatus = ref("Policies active");
const turnError = ref("");
const recording = ref(false);
const processing = ref(false);
const elapsedTenths = ref(0);
const waveLevels = ref([
  22, 36, 64, 42, 76, 52, 88, 46, 70, 34, 58, 28, 48, 32, 20, 40, 62, 82, 54,
  30, 68, 44, 24, 38,
]);
const search = ref("");
const onboardingStep = ref(0);
const onboardingDismissed = ref(false);
const notifications = ref<NotificationItem[]>(
  seededNotifications.map((item) => ({
    ...item,
    assistantPlan: [...item.assistantPlan],
  })),
);
const notificationFilter = ref<NotificationFilter>("open");
const selectedNotificationId = ref(seededNotifications[0]?.id ?? "");
const assistantWorkingId = ref("");
const assistantReviews = ref<Record<string, boolean>>({});
let timer: ReturnType<typeof setInterval> | null = null;
let assistantTimer: ReturnType<typeof setTimeout> | null = null;

const onboardingSteps = [
  {
    title: "Choose a route",
    copy: "Start with Direct so the original acoustic signal stays in the reasoning path.",
  },
  {
    title: "Generate a sample turn",
    copy: "Create representative turn evidence without requesting microphone access.",
  },
  {
    title: "Inspect the result",
    copy: "Open Sessions and review route, latency, signal, model, and transcript together.",
  },
];
const onboardingActions = [
  "Select Direct route",
  "Generate sample turn",
  "Inspect result",
];

const pageTitle = computed(
  () =>
    navigation.find((item) => item.id === activeView.value)?.label ??
    "Operations overview",
);
const visibleTurns = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return recentTurns.value;
  return recentTurns.value.filter((turn) =>
    Object.values(turn).some((value) => value.toLowerCase().includes(query)),
  );
});
const elapsed = computed(() => `${(elapsedTenths.value / 10).toFixed(1)}s`);
const initials = computed(
  () =>
    user.value?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) ?? "LD",
);
const isDemo = computed(() => isGuestDemo.value || user.value?.role === "demo");
const openNotificationCount = computed(
  () => notifications.value.filter((item) => item.status === "open").length,
);
const assistanceNotificationCount = computed(
  () =>
    notifications.value.filter(
      (item) => item.status === "open" && item.requiresAssistance,
    ).length,
);
const resolvedNotificationCount = computed(
  () => notifications.value.filter((item) => item.status === "resolved").length,
);
const visibleNotifications = computed(() =>
  notifications.value.filter((item) => {
    if (notificationFilter.value === "all") return true;
    if (notificationFilter.value === "assistance")
      return item.status === "open" && item.requiresAssistance;
    return item.status === notificationFilter.value;
  }),
);
const selectedNotification = computed(() => {
  const selected = notifications.value.find(
    (item) => item.id === selectedNotificationId.value,
  );
  if (
    selected &&
    visibleNotifications.value.some((item) => item.id === selected.id)
  )
    return selected;
  return visibleNotifications.value[0] ?? null;
});
const assistantReady = computed(() =>
  Boolean(
    selectedNotification.value &&
      assistantReviews.value[selectedNotification.value.id],
  ),
);

async function logout() {
  if (isGuestDemo.value) {
    await navigateTo("/");
    return;
  }
  await $fetch("/api/auth/logout", { method: "POST" });
  await navigateTo("/login", { external: true });
}

function addDemoTurn(
  transcript = "Demo transcript generated locally for this browser-only session.",
) {
  const turn: Turn = {
    id: `demo_${crypto.randomUUID().slice(0, 8)}`,
    time: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    duration: `${Math.max(2.8, elapsedTenths.value / 10).toFixed(1)}s`,
    route: routeMode.value === "standard" ? "Fallback" : "Direct",
    model: routeMode.value === "standard" ? "STT + LLM" : selectedModel.value,
    latency: routeMode.value === "standard" ? "842ms" : "496ms",
    signal: "Natural cadence",
    status: "Complete",
    transcript: shadowTranscripts.value
      ? transcript
      : "Transcript disabled for this turn.",
  };
  recentTurns.value.unshift(turn);
  return turn;
}

function advanceOnboarding() {
  if (onboardingStep.value === 0) {
    routeMode.value = "direct";
    onboardingStep.value = 1;
    return;
  }
  if (onboardingStep.value === 1) {
    addDemoTurn(
      "This guided sample shows the evidence available after a representative direct-audio turn.",
    );
    onboardingStep.value = 2;
    return;
  }
  if (onboardingStep.value === 2) {
    const turn = recentTurns.value[0];
    if (turn) showTurn(turn);
    onboardingStep.value = 3;
  }
}

function toggleRecording() {
  if (recording.value) {
    finishTurn();
    return;
  }

  recording.value = true;
  elapsedTenths.value = 0;
  timer = setInterval(() => {
    elapsedTenths.value += 1;
    waveLevels.value = waveLevels.value.map(() =>
      Math.floor(18 + Math.random() * 74),
    );
  }, 100);
}

function finishTurn() {
  recording.value = false;
  if (timer) clearInterval(timer);
  timer = null;
  processing.value = true;

  setTimeout(async () => {
    processing.value = false;
    const durationMs = elapsedTenths.value * 100;
    turnError.value = "";

    if (isDemo.value) {
      addDemoTurn();
      elapsedTenths.value = 0;
      return;
    }

    try {
      const result = await $fetch<{ turn: Turn }>("/api/voice/turns", {
        method: "POST",
        body: {
          durationMs,
          route: routeMode.value === "standard" ? "fallback" : "direct",
          model:
            routeMode.value === "standard" ? "STT + LLM" : selectedModel.value,
          latencyMs: routeMode.value === "standard" ? 842 : 496,
          signal: "Natural cadence",
          status: "complete",
          transcript: shadowTranscripts.value
            ? "Shadow transcript generated beside the audio-native reasoning path."
            : null,
          acousticSignals: acousticSignals.value ? { cadence: "natural" } : {},
        },
      });
      recentTurns.value.unshift(result.turn);
    } catch {
      turnError.value =
        "The simulated turn completed but could not be persisted.";
    }

    elapsedTenths.value = 0;
  }, 700);
}

async function savePolicy() {
  policySaving.value = true;
  policyStatus.value = "Saving…";
  const retentionHours =
    (
      {
        "Transient only": 0,
        "1 hour": 1,
        "24 hours": 24,
        "7 days": 168,
      } as Record<string, number>
    )[retention.value] ?? 24;

  try {
    await $fetch("/api/data-policy", {
      method: "PATCH",
      body: {
        shadowTranscripts: shadowTranscripts.value,
        consentLogging: consentLogging.value,
        acousticSignals: acousticSignals.value,
        rawAudioRetentionHours: retentionHours,
      },
    });
    policyStatus.value = "Policy saved";
  } catch {
    policyStatus.value = "Unable to save policy";
  } finally {
    policySaving.value = false;
  }
}

function showTurn(turn: Turn) {
  activeView.value = "sessions";
  search.value = turn.id;
}

function openNotifications() {
  activeView.value = "notifications";
  notificationFilter.value = "open";
  const firstOpen = notifications.value.find((item) => item.status === "open");
  if (firstOpen) selectedNotificationId.value = firstOpen.id;
}

function setNotificationFilter(filter: NotificationFilter) {
  notificationFilter.value = filter;
  const firstMatch = notifications.value.find((item) => {
    if (filter === "all") return true;
    if (filter === "assistance")
      return item.status === "open" && item.requiresAssistance;
    return item.status === filter;
  });
  if (firstMatch) selectedNotificationId.value = firstMatch.id;
}

function requestAssistantReview() {
  const item = selectedNotification.value;
  if (!item || !item.requiresAssistance || item.status === "resolved") return;
  if (assistantTimer) clearTimeout(assistantTimer);
  assistantWorkingId.value = item.id;
  assistantTimer = setTimeout(() => {
    assistantReviews.value = { ...assistantReviews.value, [item.id]: true };
    assistantWorkingId.value = "";
    assistantTimer = null;
  }, 650);
}

function applyAssistantCorrection() {
  const item = selectedNotification.value;
  if (!item || !assistantReviews.value[item.id] || item.status === "resolved")
    return;

  if (item.category === "routing") {
    routeMode.value = "adaptive";
    fallbackThreshold.value = 0.78;
  }
  if (item.category === "privacy") {
    retention.value = "Transient only";
    consentLogging.value = true;
    policyStatus.value = isDemo.value
      ? "Correction applied locally"
      : "Review and save policy";
  }

  item.status = "resolved";
  item.time = "Just now";
  item.resolution = `Operator approved assistant suggestion: ${item.suggestedAction}`;
  notificationFilter.value = "all";
  selectedNotificationId.value = item.id;
}

function resolveNotification() {
  const item = selectedNotification.value;
  if (!item || item.status === "resolved") return;
  item.status = "resolved";
  item.time = "Just now";
  item.resolution =
    "Marked resolved after operator review without an assistant-applied change.";
  notificationFilter.value = "all";
  selectedNotificationId.value = item.id;
}

function reopenNotification() {
  const item = selectedNotification.value;
  if (!item) return;
  item.status = "open";
  item.time = "Just now";
  item.resolution = undefined;
  notificationFilter.value = "open";
  selectedNotificationId.value = item.id;
}

function viewNotificationTurn() {
  const item = selectedNotification.value;
  if (!item?.relatedTurnId) return;
  const turn = recentTurns.value.find(
    (candidate) => candidate.id === item.relatedTurnId,
  );
  if (turn) showTurn(turn);
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  if (assistantTimer) clearTimeout(assistantTimer);
});

useHead({
  title: "Dashboard · Listen Direct",
  meta: [
    {
      name: "description",
      content: "Operate and observe audio-native voice sessions.",
    },
  ],
});
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
        <button>{{ user?.workspace ?? "Workspace" }} <b>⌄</b></button>
      </div>

      <nav aria-label="Dashboard navigation">
        <button
          v-for="item in navigation"
          :key="item.id"
          :class="{ active: activeView === item.id }"
          @click="activeView = item.id"
        >
          <span>{{ item.hint }}</span
          >{{ item.label }}
        </button>
      </nav>

      <NuxtLink v-if="user?.role === 'admin'" class="admin-link" to="/admin"
        ><span>⌘</span> Administration</NuxtLink
      >

      <div class="sidebar-status">
        <div><span class="status-dot" /> Simulation ready</div>
        <small>Representative environment</small>
      </div>
      <div class="sidebar-legal">
        <NuxtLink to="/help">Help</NuxtLink
        ><NuxtLink to="/privacy">Privacy</NuxtLink
        ><NuxtLink to="/terms">Terms</NuxtLink>
      </div>
      <div class="profile">
        <span>{{ initials }}</span>
        <div>
          <strong>{{ user?.name }}</strong
          ><small>{{ user?.role.toUpperCase() }}</small>
        </div>
        <button aria-label="Sign out" title="Sign out" @click="logout">
          ↗
        </button>
      </div>
    </aside>

    <main class="dashboard-main">
      <header class="dashboard-header">
        <div>
          <span>VOICE OPERATIONS / {{ activeView.toUpperCase() }}</span>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-actions">
          <button
            class="icon-button"
            :class="{ active: activeView === 'notifications' }"
            :aria-label="`Notifications, ${openNotificationCount} open`"
            @click="openNotifications"
          >
            ◈<span v-if="openNotificationCount">{{
              openNotificationCount
            }}</span>
          </button>
          <button
            class="session-button"
            :class="{ recording }"
            @click="toggleRecording"
          >
            <i />{{
              recording
                ? `End turn · ${elapsed}`
                : processing
                  ? "Processing…"
                  : "Start simulated turn"
            }}
          </button>
        </div>
      </header>

      <div class="simulation-banner">
        <div>
          <span>INTERACTIVE SIMULATION</span
          ><strong
            >No microphone audio is captured and no AI provider is called.
            Metrics, signals, models, and responses are representative product
            data.</strong
          >
        </div>
        <NuxtLink to="/help#understand-the-demo"
          >Understand the scope →</NuxtLink
        >
      </div>
      <div v-if="isGuestDemo" class="demo-banner">
        <div>
          <span>GUEST SANDBOX</span
          ><strong
            >No account required. New turns remain in this browser session and
            all protected APIs stay unavailable.</strong
          >
        </div>
        <button @click="logout">Exit sandbox</button>
      </div>
      <div v-else-if="isDemo" class="demo-banner">
        <div>
          <span>DEMO ACCOUNT</span
          ><strong
            >Explore safely—new voice turns remain in this browser session and
            policies are read-only.</strong
          >
        </div>
        <button @click="logout">Exit demo</button>
      </div>

      <section
        v-if="isGuestDemo && !onboardingDismissed && activeView === 'overview'"
        class="onboarding panel"
        aria-label="Demo onboarding"
      >
        <header>
          <div>
            <span
              >GUIDED START / {{ Math.min(onboardingStep + 1, 3) }} OF 3</span
            >
            <h2>
              {{
                onboardingStep < 3
                  ? "Prove the workflow in three moves."
                  : "You completed the product tour."
              }}
            </h2>
          </div>
          <button
            aria-label="Dismiss guided start"
            @click="onboardingDismissed = true"
          >
            ×
          </button>
        </header>
        <ol>
          <li
            v-for="(step, index) in onboardingSteps"
            :key="step.title"
            :class="{
              active: onboardingStep === index,
              complete: onboardingStep > index,
            }"
          >
            <span>{{
              onboardingStep > index ? "✓" : String(index + 1).padStart(2, "0")
            }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <p>{{ step.copy }}</p>
            </div>
          </li>
        </ol>
        <footer>
          <p v-if="onboardingStep < 3">
            Everything in this tour is generated locally and disappears when the
            sandbox closes.
          </p>
          <p v-else>
            Your sample evidence is open in Sessions. Create a workspace when
            you are ready to persist operating data.
          </p>
          <button v-if="onboardingStep < 3" @click="advanceOnboarding">
            {{ onboardingActions[onboardingStep] }} →</button
          ><NuxtLink v-else to="/login?mode=signup"
            >Create a protected workspace →</NuxtLink
          >
        </footer>
      </section>
      <p v-if="turnError" class="persistence-error" role="alert">
        {{ turnError }}
      </p>

      <template v-if="activeView === 'overview'">
        <section
          class="metric-grid"
          aria-label="Representative performance metrics"
        >
          <article>
            <div>
              <span>DIRECT ROUTE RATE</span><b class="trend up">↗ 4.2%</b>
            </div>
            <strong>94.7<small>%</small></strong>
            <p>12,842 of 13,561 turns</p>
          </article>
          <article>
            <div><span>MEDIAN LATENCY</span><b class="trend up">↓ 38ms</b></div>
            <strong>482<small>ms</small></strong>
            <p>Audio in → first audio out</p>
          </article>
          <article>
            <div><span>TURN SUCCESS</span><b class="trend up">↗ 0.6%</b></div>
            <strong>99.2<small>%</small></strong>
            <p>Completed without interruption</p>
          </article>
          <article>
            <div>
              <span>FALLBACKS TODAY</span><b class="trend neutral">719 turns</b>
            </div>
            <strong>5.3<small>%</small></strong>
            <p>Noise is the leading trigger</p>
          </article>
        </section>

        <section class="operations-grid">
          <article class="console-card panel">
            <div class="panel-head">
              <div>
                <span>SIMULATED TURN CONSOLE</span
                ><strong>{{
                  recording
                    ? "Generating representative signal"
                    : processing
                      ? "Generating route evidence"
                      : "Ready for simulated input"
                }}</strong>
              </div>
              <div class="live-state" :class="{ active: recording }">
                <i />{{ recording ? "SIMULATING" : "STANDBY" }}
              </div>
            </div>
            <div class="console-body">
              <button
                class="record-orb"
                :class="{ recording, processing }"
                :aria-label="
                  recording ? 'Stop simulated turn' : 'Start simulated turn'
                "
                @click="toggleRecording"
              >
                <span>{{ recording ? "■" : processing ? "···" : "▶" }}</span>
              </button>
              <div class="waveform" :class="{ recording }" aria-hidden="true">
                <i
                  v-for="(level, index) in waveLevels"
                  :key="index"
                  :style="{
                    height: `${recording ? level : Math.max(12, level * 0.34)}%`,
                  }"
                />
              </div>
              <div class="duration">
                <strong>{{ elapsed }}</strong
                ><span>TURN LENGTH</span>
              </div>
            </div>
            <div class="signal-strip">
              <div>
                <span>SAMPLE FORMAT</span><strong>PCM16 · 24 kHz</strong>
              </div>
              <div>
                <span>ENERGY</span
                ><strong>{{ recording ? "−18.4 dB" : "—" }}</strong>
              </div>
              <div>
                <span>PITCH</span
                ><strong>{{ recording ? "Elevated" : "—" }}</strong>
              </div>
              <div>
                <span>END-OF-TURN</span
                ><strong>{{ recording ? "Simulating" : "Semantic" }}</strong>
              </div>
            </div>
          </article>

          <article class="route-card panel">
            <div class="panel-head">
              <div>
                <span>ACTIVE ROUTE</span><strong>Adaptive dual path</strong>
              </div>
              <button class="text-button" @click="activeView = 'controls'">
                Configure ↗
              </button>
            </div>
            <div class="route-selector">
              <button
                v-for="route in [
                  'adaptive',
                  'direct',
                  'standard',
                ] as RouteMode[]"
                :key="route"
                :class="{ active: routeMode === route }"
                @click="routeMode = route"
              >
                <i />{{ route }}
              </button>
            </div>
            <div class="route-flow">
              <div>
                <span>01</span><strong>Voice turn</strong
                ><small>audio/pcm</small>
              </div>
              <b>→</b>
              <div class="router-node">
                <span>02</span><strong>Route gate</strong
                ><small>{{ routeMode }}</small>
              </div>
              <b>→</b>
              <div>
                <span>03</span
                ><strong>{{
                  routeMode === "standard" ? "STT + LLM" : selectedModel
                }}</strong
                ><small>{{
                  routeMode === "standard" ? "fallback" : "audio native"
                }}</small>
              </div>
            </div>
            <dl>
              <div>
                <dt>Primary model</dt>
                <dd>{{ selectedModel }}</dd>
              </div>
              <div>
                <dt>Fallback threshold</dt>
                <dd>Confidence &lt; {{ fallbackThreshold.toFixed(2) }}</dd>
              </div>
              <div>
                <dt>Shadow transcript</dt>
                <dd>
                  <button
                    class="mini-toggle"
                    :class="{ on: shadowTranscripts }"
                    @click="shadowTranscripts = !shadowTranscripts"
                  >
                    <i />
                  </button>
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section class="turns-panel panel">
          <div class="panel-head">
            <div>
              <span>RECENT VOICE TURNS</span
              ><strong>Representative turn history</strong>
            </div>
            <button class="text-button" @click="activeView = 'sessions'">
              View all sessions ↗
            </button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Turn</th>
                  <th>Time</th>
                  <th>Route</th>
                  <th>Signal</th>
                  <th>Model</th>
                  <th>Latency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="turn in recentTurns.slice(0, 4)" :key="turn.id">
                  <td>
                    <button class="turn-link" @click="showTurn(turn)">
                      <strong>{{ turn.id }}</strong
                      ><small>{{ turn.duration }}</small>
                    </button>
                  </td>
                  <td>{{ turn.time }}</td>
                  <td>
                    <span
                      class="route-pill"
                      :class="turn.route.toLowerCase()"
                      >{{ turn.route }}</span
                    >
                  </td>
                  <td>{{ turn.signal }}</td>
                  <td>{{ turn.model }}</td>
                  <td>{{ turn.latency }}</td>
                  <td>
                    <span class="status-pill" :class="turn.status.toLowerCase()"
                      ><i />{{ turn.status }}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <template v-else-if="activeView === 'notifications'">
        <section class="registry-intro notification-intro panel">
          <div>
            <span>AI-ASSISTED TRIAGE / REPRESENTATIVE</span>
            <h2>See the signal. Approve the correction.</h2>
            <p>
              Review operational notices, ask for a bounded diagnosis when
              assistance is useful, and keep a human decision between every
              suggestion and change.
            </p>
          </div>
          <button class="session-button" @click="setNotificationFilter('open')">
            {{ openNotificationCount }} open notices
          </button>
        </section>

        <section class="notification-stats" aria-label="Notification summary">
          <article>
            <span>OPEN</span><strong>{{ openNotificationCount }}</strong>
            <p>Waiting for operator review</p>
          </article>
          <article>
            <span>NEEDS ASSISTANCE</span
            ><strong>{{ assistanceNotificationCount }}</strong>
            <p>Assistant analysis is available</p>
          </article>
          <article>
            <span>RESOLVED</span
            ><strong>{{ resolvedNotificationCount }}</strong>
            <p>Resolution evidence retained locally</p>
          </article>
        </section>

        <section class="notification-layout">
          <article
            class="notification-inbox panel"
            aria-label="Notification inbox"
          >
            <header>
              <div>
                <span>NOTIFICATION INBOX</span
                ><strong>{{ visibleNotifications.length }} visible</strong>
              </div>
              <div
                class="notification-filters"
                role="group"
                aria-label="Filter notifications"
              >
                <button
                  v-for="filter in notificationFilters"
                  :key="filter.id"
                  :class="{ active: notificationFilter === filter.id }"
                  :aria-pressed="notificationFilter === filter.id"
                  @click="setNotificationFilter(filter.id)"
                >
                  {{ filter.label }}
                </button>
              </div>
            </header>
            <div class="notification-list">
              <button
                v-for="item in visibleNotifications"
                :key="item.id"
                class="notification-row"
                :class="[
                  { selected: selectedNotification?.id === item.id },
                  item.severity,
                ]"
                @click="selectedNotificationId = item.id"
              >
                <i aria-hidden="true" />
                <div>
                  <span>{{ item.category }} · {{ item.time }}</span>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.summary }}</p>
                  <small
                    v-if="item.requiresAssistance && item.status === 'open'"
                    >AI assistance available</small
                  >
                  <small v-else>{{ item.status }}</small>
                </div>
              </button>
              <p v-if="!visibleNotifications.length" class="empty">
                No notifications match this filter.
              </p>
            </div>
          </article>

          <article
            v-if="selectedNotification"
            class="notification-detail panel"
            aria-live="polite"
          >
            <header>
              <span
                class="severity-label"
                :class="selectedNotification.severity"
                >{{ selectedNotification.severity }}</span
              >
              <span
                class="notification-status"
                :class="selectedNotification.status"
                >{{ selectedNotification.status }}</span
              >
            </header>
            <div class="notification-detail-body">
              <span class="notification-id">{{ selectedNotification.id }}</span>
              <h2>{{ selectedNotification.title }}</h2>
              <p>{{ selectedNotification.summary }}</p>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{{ selectedNotification.source }}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{{ selectedNotification.category }}</dd>
                </div>
                <div>
                  <dt>Observed</dt>
                  <dd>{{ selectedNotification.time }}</dd>
                </div>
                <div>
                  <dt>Related turn</dt>
                  <dd>{{ selectedNotification.relatedTurnId ?? "None" }}</dd>
                </div>
              </dl>

              <section
                class="assistant-workspace"
                aria-label="AI correction assistant"
              >
                <header>
                  <div>
                    <span>AI CORRECTION ASSISTANT</span
                    ><strong>Representative analysis</strong>
                  </div>
                  <b>HUMAN APPROVAL REQUIRED</b>
                </header>

                <div
                  v-if="selectedNotification.status === 'resolved'"
                  class="resolution-card"
                >
                  <span>RESOLUTION RECORDED</span>
                  <p>{{ selectedNotification.resolution }}</p>
                </div>

                <div
                  v-else-if="assistantWorkingId === selectedNotification.id"
                  class="assistant-progress"
                  role="status"
                >
                  <i />
                  <div>
                    <strong>Analyzing evidence and policy constraints…</strong>
                    <p>
                      Comparing the alert with the representative route and
                      workspace configuration.
                    </p>
                  </div>
                </div>

                <div v-else-if="assistantReady" class="assistant-answer">
                  <span>DIAGNOSIS</span>
                  <p>{{ selectedNotification.diagnosis }}</p>
                  <span>CORRECTION PLAN</span>
                  <ol>
                    <li
                      v-for="step in selectedNotification.assistantPlan"
                      :key="step"
                    >
                      {{ step }}
                    </li>
                  </ol>
                  <div class="assistant-suggestion">
                    <span>SUGGESTED CHANGE</span
                    ><strong>{{ selectedNotification.suggestedAction }}</strong>
                  </div>
                  <button
                    class="assistant-apply"
                    @click="applyAssistantCorrection"
                  >
                    Approve and apply correction →
                  </button>
                  <small
                    >This updates representative dashboard state only. Persisted
                    production changes would require a protected backend
                    workflow.</small
                  >
                </div>

                <div
                  v-else-if="selectedNotification.requiresAssistance"
                  class="assistant-prompt"
                >
                  <p>
                    Ask the assistant to explain the evidence, identify the
                    safest bounded correction, and prepare it for your approval.
                  </p>
                  <button @click="requestAssistantReview">
                    Ask AI assistant →
                  </button>
                </div>

                <div v-else class="assistant-prompt">
                  <p>
                    This informational notice does not require AI assistance or
                    a configuration change.
                  </p>
                </div>
              </section>
            </div>
            <footer>
              <button
                v-if="selectedNotification.status === 'open'"
                @click="resolveNotification"
              >
                Mark resolved manually
              </button>
              <button v-else @click="reopenNotification">
                Reopen notification
              </button>
              <button
                v-if="selectedNotification.relatedTurnId"
                class="primary"
                @click="viewNotificationTurn"
              >
                View related turn →
              </button>
            </footer>
          </article>
        </section>
      </template>

      <template v-else-if="activeView === 'sessions'">
        <section class="section-toolbar panel">
          <div>
            <span>SESSION EXPLORER</span
            ><strong>{{ visibleTurns.length }} matching turns</strong>
          </div>
          <label
            ><span>⌕</span
            ><input
              v-model="search"
              placeholder="Search turn, signal, or model"
          /></label>
        </section>
        <section class="session-layout">
          <div class="session-list panel">
            <button
              v-for="turn in visibleTurns"
              :key="turn.id"
              class="session-row"
            >
              <div>
                <span>{{ turn.id }}</span
                ><strong>{{ turn.transcript }}</strong>
              </div>
              <small>{{ turn.time }} · {{ turn.duration }}</small
              ><span class="route-pill" :class="turn.route.toLowerCase()">{{
                turn.route
              }}</span
              ><b>{{ turn.latency }}</b>
            </button>
            <p v-if="!visibleTurns.length" class="empty">
              No voice turns match that search.
            </p>
          </div>
          <aside class="session-summary panel">
            <span>SESSION HEALTH</span><strong>99.2%</strong>
            <p>
              40 of 40 recent turns completed. One fallback was triggered by
              background noise.
            </p>
            <div class="health-ring"><i /><b>HEALTHY</b></div>
            <dl>
              <div>
                <dt>Average duration</dt>
                <dd>6.0s</dd>
              </div>
              <div>
                <dt>P95 latency</dt>
                <dd>812ms</dd>
              </div>
              <div>
                <dt>Barge-ins</dt>
                <dd>3</dd>
              </div>
            </dl>
          </aside>
        </section>
      </template>

      <template v-else-if="activeView === 'models'">
        <section class="registry-intro panel">
          <div>
            <span>CAPABILITY REGISTRY / REPRESENTATIVE</span>
            <h2>One interface. Every audio model.</h2>
            <p>
              Explore how codec, latency, and fallback capability negotiation
              will work before a voice turn begins.
            </p>
          </div>
          <button class="session-button" disabled>
            Provider setup planned
          </button>
        </section>
        <section class="model-grid">
          <article
            v-for="modelItem in models"
            :key="modelItem.name"
            class="model-card panel"
            :class="{ selected: selectedModel === modelItem.name }"
            @click="selectedModel = modelItem.name"
          >
            <div class="model-top">
              <span>{{ modelItem.provider }}</span
              ><b><i />{{ modelItem.status }}</b>
            </div>
            <h3>{{ modelItem.name }}</h3>
            <p>{{ modelItem.codecs }}</p>
            <div class="quality">
              <span>PERCEPTION SCORE</span
              ><strong>{{ modelItem.quality }}</strong
              ><i><b :style="{ width: `${modelItem.quality}%` }" /></i>
            </div>
            <dl>
              <div>
                <dt>Median latency</dt>
                <dd>{{ modelItem.latency }}</dd>
              </div>
              <div>
                <dt>Streaming</dt>
                <dd>Full duplex</dd>
              </div>
            </dl>
            <button>
              {{
                selectedModel === modelItem.name
                  ? "Active primary"
                  : "Set as primary"
              }}
            </button>
          </article>
        </section>
      </template>

      <template v-else-if="activeView === 'evals'">
        <section class="registry-intro panel">
          <div>
            <span>AUDIO-NATIVE EVALUATION / REPRESENTATIVE</span>
            <h2>Measure what transcripts miss.</h2>
            <p>
              Preview direct-versus-cascaded evidence across representative
              acoustic conditions.
            </p>
          </div>
          <button class="session-button" disabled>Runner planned</button>
        </section>
        <section class="eval-grid">
          <article
            v-for="suite in evaluationSuites"
            :key="suite.title"
            class="eval-card panel"
          >
            <div>
              <span>{{ suite.title }}</span
              ><b>{{ suite.change }}</b>
            </div>
            <strong>{{ suite.score }}<small>/100</small></strong>
            <div class="eval-bar">
              <i :style="{ width: `${suite.score}%` }" />
            </div>
            <p>{{ suite.runs }} paired test runs</p>
          </article>
        </section>
        <section class="comparison panel">
          <div class="panel-head">
            <div>
              <span>DIRECT VS CASCADED</span
              ><strong>Perception advantage by signal</strong>
            </div>
            <small>Last 7 days</small>
          </div>
          <div class="comparison-chart">
            <div v-for="(suite, index) in evaluationSuites" :key="suite.title">
              <span>{{ suite.title }}</span
              ><i
                ><b :style="{ width: `${72 + index * 6}%` }" /><em
                  :style="{ width: `${48 + index * 4}%` }" /></i
              ><strong>+{{ 18 - index * 2 }} pts</strong>
            </div>
          </div>
          <footer>
            <span><i class="direct-key" /> Direct audio</span
            ><span><i class="base-key" /> STT baseline</span>
          </footer>
        </section>
      </template>

      <template v-else-if="activeView === 'controls'">
        <section class="registry-intro panel">
          <div>
            <span>ACOUSTIC DATA CONTROLS</span>
            <h2>Keep the signal. Control the footprint.</h2>
            <p>
              Define what is retained, logged, redacted, and exposed to
              downstream applications.
            </p>
          </div>
          <div class="policy-actions">
            <span class="saved-state"><i /> {{ policyStatus }}</span
            ><button
              class="session-button"
              :disabled="policySaving || isDemo"
              @click="savePolicy"
            >
              Save policy
            </button>
          </div>
        </section>
        <section class="control-grid">
          <article class="control-card panel">
            <div>
              <span>SHADOW TRANSCRIPTS</span
              ><button
                class="mini-toggle"
                :class="{ on: shadowTranscripts }"
                @click="shadowTranscripts = !shadowTranscripts"
              >
                <i />
              </button>
            </div>
            <h3>Generate text beside the direct path</h3>
            <p>
              Use captions and debugging text without making it the model’s
              input.
            </p>
          </article>
          <article class="control-card panel">
            <div>
              <span>CONSENT-AWARE LOGGING</span
              ><button
                class="mini-toggle"
                :class="{ on: consentLogging }"
                @click="consentLogging = !consentLogging"
              >
                <i />
              </button>
            </div>
            <h3>Respect session consent state</h3>
            <p>
              Store traces only when the client has supplied a valid consent
              signal.
            </p>
          </article>
          <article class="control-card panel">
            <div>
              <span>ACOUSTIC SIGNALS</span
              ><button
                class="mini-toggle"
                :class="{ on: acousticSignals }"
                @click="acousticSignals = !acousticSignals"
              >
                <i />
              </button>
            </div>
            <h3>Expose non-sensitive vocal features</h3>
            <p>
              Return pitch, energy, cadence, and turn-taking signals to the
              application.
            </p>
          </article>
          <article class="control-card panel">
            <div>
              <span>RAW AUDIO RETENTION</span
              ><select v-model="retention">
                <option>Transient only</option>
                <option>1 hour</option>
                <option>24 hours</option>
                <option>7 days</option>
              </select>
            </div>
            <h3>{{ retention }}</h3>
            <p>
              Automatically purge raw audio after the configured retention
              window.
            </p>
          </article>
        </section>
        <section class="policy-code panel">
          <div class="panel-head">
            <div>
              <span>ACTIVE POLICY</span><strong>production-default</strong>
            </div>
            <button class="text-button">Copy JSON</button>
          </div>
          <pre><code>{
  "routing": "{{ routeMode }}",
  "shadow_transcript": {{ shadowTranscripts }},
  "consent_logging": {{ consentLogging }},
  "acoustic_signals": {{ acousticSignals }},
  "raw_audio_retention": "{{ retention }}"
}</code></pre>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped src="~/assets/dashboard.css"></style>
