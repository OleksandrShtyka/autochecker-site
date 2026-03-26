export type Theme = "light" | "dark";

export type Feature = {
  icon: string;
  title: string;
  desc: string;
  count: number | null;
  bullets: string[];
};

export type Stat = {
  value: string;
  label: string;
};

export type SecurityItem = readonly [title: string, desc: string];

export type NavItem = {
  id: string;
  label: string;
};

export type PreviewItem = {
  label: string;
  value: string;
};

export type DownloadState = {
  visible: boolean;
  label: string;
  progress: number;
  done: boolean;
};

export type CabinetProfile = {
  name: string;
  role: string;
  usage: string;
  favoriteFeature: string;
};

export type AuthRole = "USER" | "ADMIN";

export type AuthMode = "login" | "register";

export type AuthForm = {
  name: string;
  email: string;
  password: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
};

export type SuggestionDraft = {
  title: string;
  area: string;
  summary: string;
  impact: string;
};

export type SuggestionStatus =
  | "NEW"
  | "REVIEWING"
  | "PLANNED"
  | "SHIPPED"
  | "REJECTED";

export type SuggestionRecord = SuggestionDraft & {
  id: string;
  status: SuggestionStatus;
  adminNote: string;
  createdAt: string;
};

export type AdminSuggestionRecord = SuggestionRecord & {
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  title: string;
  description: string;
  tone: ToastTone;
};

export type ActionFeedback = {
  ok: boolean;
  title: string;
  description: string;
  tone: ToastTone;
};

export type SocialLink = {
  id: string;
  label: string;
  handle: string;
  url: string;
  accent: string;
};

export type AccountData = {
  avatarUrl: string;
  connectedGoogle: boolean;
  googleEmail: string;
  connectedGithub: boolean;
  githubUsername: string;
  totpEnabled: boolean;
};

// ── Fitness Module ────────────────────────────────────────────

export type FitnessGoal = "strength" | "hypertrophy" | "endurance" | "general";

export type WorkoutType =
  | "push" | "pull" | "legs" | "upper" | "lower"
  | "full_body" | "cardio" | "other";

export type FitnessProfile = {
  userId: string;
  monthlyGymCost: number;
  fitnessGoal: FitnessGoal;
  fitnessBadge: string;
};

export type Supplement = {
  id: string;
  userId: string;
  name: string;
  totalWeightG: number;
  servingSizeG: number;
  servingsPerDay: number;
  price: number;
  purchaseDate: string; // ISO date string
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplementStatus = {
  id: string;
  name: string;
  remainingPct: number;
  remainingG: number;
  daysLeft: number;
  depletionDate: string;
  costPerServing: number;
};

export type Exercise = {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
};

export type GymSession = {
  id: string;
  userId: string;
  date: string;
  durationMin: number;
  workoutType: WorkoutType;
  volumeKg: number;
  exercises: Exercise[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GymRoi = {
  sessionsCount: number;
  monthlyCost: number;
  costPerSession: number;
};
