export type ViewName =
  | "overview"
  | "notifications"
  | "sessions"
  | "models"
  | "evals"
  | "controls";
export type RouteMode = "adaptive" | "direct" | "standard";
export type NotificationSeverity = "critical" | "warning" | "info";
export type NotificationStatus = "open" | "resolved";
export type NotificationFilter = "open" | "assistance" | "resolved" | "all";

export type Turn = {
  id: string;
  time: string;
  duration: string;
  route: "Direct" | "Fallback";
  model: string;
  latency: string;
  signal: string;
  status: "Complete" | "Flagged";
  transcript: string;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "demo" | "user" | "admin";
  workspace: string;
  organizationId: string;
};

export type DataPolicy = {
  shadow_transcripts: boolean;
  consent_logging: boolean;
  acoustic_signals: boolean;
  raw_audio_retention_hours: number;
  version: number;
  updated_at: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  summary: string;
  severity: NotificationSeverity;
  status: NotificationStatus;
  category: "routing" | "privacy" | "model";
  time: string;
  source: string;
  relatedTurnId?: string;
  requiresAssistance: boolean;
  diagnosis: string;
  assistantPlan: string[];
  suggestedAction: string;
  resolution?: string;
};

export const navigation: { id: ViewName; label: string; hint: string }[] = [
  { id: "overview", label: "Operations overview", hint: "01" },
  { id: "notifications", label: "Notifications", hint: "02" },
  { id: "sessions", label: "Sessions", hint: "03" },
  { id: "models", label: "Model registry", hint: "04" },
  { id: "evals", label: "Audio evals", hint: "05" },
  { id: "controls", label: "Data controls", hint: "06" },
];

export const models = [
  {
    name: "Inkling Audio",
    provider: "Primary",
    latency: "482 ms",
    quality: 96,
    codecs: "PCM16 · Opus",
    status: "Ready",
  },
  {
    name: "Gemma 4 Audio",
    provider: "Secondary",
    latency: "618 ms",
    quality: 92,
    codecs: "PCM16 · WAV",
    status: "Ready",
  },
  {
    name: "Realtime Voice",
    provider: "Fallback",
    latency: "744 ms",
    quality: 89,
    codecs: "PCM16 · μ-law",
    status: "Ready",
  },
];

export const evaluationSuites = [
  { title: "Pitch + emphasis", score: 94, runs: 240, change: "+2.4%" },
  { title: "Accents + dialects", score: 88, runs: 380, change: "+1.1%" },
  { title: "Noise resilience", score: 91, runs: 192, change: "+4.8%" },
  { title: "Turn boundaries", score: 97, runs: 516, change: "+0.6%" },
];

export const seededNotifications: NotificationItem[] = [
  {
    id: "notice_route_01",
    title: "Noise fallbacks crossed the review threshold",
    summary:
      "Three representative turns fell back after Direct confidence dropped below the current workspace floor.",
    severity: "warning",
    status: "open",
    category: "routing",
    time: "4 min ago",
    source: "Adaptive route monitor",
    relatedTurnId: "demo_noise_02",
    requiresAssistance: true,
    diagnosis:
      "The route is behaving safely, but the current Direct confidence floor allows noisy turns to stay on the primary path longer than intended.",
    assistantPlan: [
      "Keep Adaptive routing active so unsupported turns retain a safe fallback.",
      "Raise the representative Direct confidence floor from 0.72 to 0.78 for noisy conditions.",
      "Review the next 30 representative turns before promoting the change to a production policy.",
    ],
    suggestedAction:
      "Use Adaptive routing with a stricter representative confidence floor and keep Standard as the fallback.",
  },
  {
    id: "notice_privacy_02",
    title: "Retention setting needs a consent-safe default",
    summary:
      "The current 24-hour raw-audio setting is longer than the minimum needed for this simulated workspace.",
    severity: "critical",
    status: "open",
    category: "privacy",
    time: "18 min ago",
    source: "Data policy guard",
    requiresAssistance: true,
    diagnosis:
      "The policy is valid for the prototype, but it does not follow the shortest-retention principle described in the workspace guidance.",
    assistantPlan: [
      "Change raw-audio retention to Transient only.",
      "Keep consent-aware logging enabled before any future trace storage.",
      "Require operator review before persisting the recommendation to a protected workspace.",
    ],
    suggestedAction:
      "Set raw-audio retention to Transient only and keep consent-aware logging enabled.",
  },
  {
    id: "notice_model_03",
    title: "Representative model registry is synchronized",
    summary:
      "All three demonstration model profiles expose compatible codec and streaming metadata.",
    severity: "info",
    status: "resolved",
    category: "model",
    time: "Yesterday",
    source: "Capability registry",
    requiresAssistance: false,
    diagnosis: "No intervention is required.",
    assistantPlan: [],
    suggestedAction: "No correction required.",
    resolution:
      "Closed automatically after the representative registry check completed.",
  },
];

export const notificationFilters: { id: NotificationFilter; label: string }[] =
  [
    { id: "open", label: "Open" },
    { id: "assistance", label: "Needs assistance" },
    { id: "resolved", label: "Resolved" },
    { id: "all", label: "All" },
  ];
