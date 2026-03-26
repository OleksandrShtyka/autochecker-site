import { randomUUID } from "node:crypto";
import type {
  AccountData,
  AdminSuggestionRecord,
  CabinetProfile,
  Exercise,
  FitnessGoal,
  FitnessProfile,
  GymRoi,
  GymSession,
  SessionUser,
  Supplement,
  SupplementStatus,
  SuggestionDraft,
  SuggestionRecord,
  SuggestionStatus,
  WorkoutType,
} from "@/features/home/types";

type DbUserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  auth_role: "USER" | "ADMIN";
  usage: string;
  favorite_feature: string;
  job_role: string;
  avatar_url: string | null;
  google_id: string | null;
  google_email: string | null;
  github_id: string | null;
  github_username: string | null;
  totp_secret: string | null;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type DbSuggestionRow = {
  id: string;
  user_id: string;
  title: string;
  area: string;
  summary: string;
  impact: string;
  status: SuggestionStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type DbSuggestionWithUserRow = DbSuggestionRow & {
  users: {
    id: string;
    email: string;
    name: string;
    job_role: string;
  } | null;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const USER_SELECT =
  "id,email,name,password_hash,auth_role,usage,favorite_feature,job_role,avatar_url,google_id,google_email,github_id,github_username,totp_secret,totp_enabled,created_at,updated_at";

function assertSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
  options?: {
    prefer?: string;
    allowEmpty?: boolean;
    countExact?: boolean;
  }
) {
  assertSupabaseEnv();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options?.prefer ? { Prefer: options.prefer } : {}),
      ...(options?.countExact ? { Prefer: "count=exact" } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204 || options?.allowEmpty) {
    return {
      data: (null as T | null),
      response,
    };
  }

  return {
    data: (await response.json()) as T,
    response,
  };
}

function mapUser(row: DbUserRow): SessionUser & { passwordHash: string; totpSecret: string | null; profile: CabinetProfile; accountData: AccountData } {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.auth_role,
    passwordHash: row.password_hash,
    profile: {
      name: row.name,
      role: row.job_role,
      usage: row.usage,
      favoriteFeature: row.favorite_feature,
    },
    accountData: {
      avatarUrl: row.avatar_url ?? "",
      connectedGoogle: !!row.google_id,
      googleEmail: row.google_email ?? "",
      connectedGithub: !!row.github_id,
      githubUsername: row.github_username ?? "",
      totpEnabled: row.totp_enabled ?? false,
    },
    totpSecret: row.totp_secret ?? null,
  };
}

function mapSuggestion(row: DbSuggestionRow): SuggestionRecord {
  return {
    id: row.id,
    title: row.title,
    area: row.area,
    summary: row.summary,
    impact: row.impact,
    status: row.status,
    adminNote: row.admin_note ?? "",
    createdAt: row.created_at,
  };
}

export const database = {
  async findUserByEmail(email: string) {
    const query = new URLSearchParams({
      select: USER_SELECT,
      email: `eq.${email}`,
      limit: "1",
    });

    const { data } = await supabaseRequest<DbUserRow[]>(`users?${query.toString()}`);
    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async findUserById(id: string) {
    const query = new URLSearchParams({
      select: USER_SELECT,
      id: `eq.${id}`,
      limit: "1",
    });

    const { data } = await supabaseRequest<DbUserRow[]>(`users?${query.toString()}`);
    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async findUserByGoogleId(googleId: string) {
    const query = new URLSearchParams({
      select: USER_SELECT,
      google_id: `eq.${googleId}`,
      limit: "1",
    });

    const { data } = await supabaseRequest<DbUserRow[]>(`users?${query.toString()}`);
    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async findUserByGithubId(githubId: string) {
    const query = new URLSearchParams({
      select: USER_SELECT,
      github_id: `eq.${githubId}`,
      limit: "1",
    });

    const { data } = await supabaseRequest<DbUserRow[]>(`users?${query.toString()}`);
    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async createUser(input: {
    email: string;
    name: string;
    passwordHash: string;
    authRole: "USER" | "ADMIN";
    profile: CabinetProfile;
  }) {
    const now = new Date().toISOString();
    const payload = {
      id: randomUUID(),
      email: input.email,
      name: input.name,
      password_hash: input.passwordHash,
      auth_role: input.authRole,
      usage: input.profile.usage,
      favorite_feature: input.profile.favoriteFeature,
      job_role: input.profile.role,
      created_at: now,
      updated_at: now,
    };

    const { data } = await supabaseRequest<DbUserRow[]>("users", {
      method: "POST",
      body: JSON.stringify(payload),
    }, {
      prefer: "return=representation",
    });

    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async updateUserProfile(userId: string, profile: CabinetProfile) {
    const query = new URLSearchParams({
      id: `eq.${userId}`,
      select: USER_SELECT,
    });

    const { data } = await supabaseRequest<DbUserRow[]>(
      `users?${query.toString()}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name,
          usage: profile.usage,
          favorite_feature: profile.favoriteFeature,
          job_role: profile.role,
          updated_at: new Date().toISOString(),
        }),
      },
      {
        prefer: "return=representation",
      }
    );

    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async updateUserAvatar(userId: string, avatarUrl: string) {
    const query = new URLSearchParams({
      id: `eq.${userId}`,
      select: USER_SELECT,
    });

    const { data } = await supabaseRequest<DbUserRow[]>(
      `users?${query.toString()}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        }),
      },
      { prefer: "return=representation" }
    );

    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async linkOAuthAccount(
    userId: string,
    provider: "google" | "github",
    providerId: string,
    meta: { email?: string; username?: string }
  ) {
    const query = new URLSearchParams({
      id: `eq.${userId}`,
      select: USER_SELECT,
    });

    const patch =
      provider === "google"
        ? { google_id: providerId, google_email: meta.email ?? "", updated_at: new Date().toISOString() }
        : { github_id: providerId, github_username: meta.username ?? "", updated_at: new Date().toISOString() };

    const { data } = await supabaseRequest<DbUserRow[]>(
      `users?${query.toString()}`,
      { method: "PATCH", body: JSON.stringify(patch) },
      { prefer: "return=representation" }
    );

    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async unlinkOAuthAccount(userId: string, provider: "google" | "github") {
    const query = new URLSearchParams({
      id: `eq.${userId}`,
      select: USER_SELECT,
    });

    const patch =
      provider === "google"
        ? { google_id: null, google_email: null, updated_at: new Date().toISOString() }
        : { github_id: null, github_username: null, updated_at: new Date().toISOString() };

    const { data } = await supabaseRequest<DbUserRow[]>(
      `users?${query.toString()}`,
      { method: "PATCH", body: JSON.stringify(patch) },
      { prefer: "return=representation" }
    );

    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async createSuggestion(userId: string, suggestion: SuggestionDraft) {
    const now = new Date().toISOString();
    await supabaseRequest("suggestions", {
      method: "POST",
      body: JSON.stringify({
        id: randomUUID(),
        user_id: userId,
        title: suggestion.title,
        area: suggestion.area,
        summary: suggestion.summary,
        impact: suggestion.impact,
        status: "NEW",
        admin_note: "",
        created_at: now,
        updated_at: now,
      }),
    }, {
      prefer: "return=minimal",
      allowEmpty: true,
    });
  },

  async listUserSuggestions(userId: string) {
    const query = new URLSearchParams({
      select: "id,user_id,title,area,summary,impact,status,admin_note,created_at,updated_at",
      user_id: `eq.${userId}`,
      order: "created_at.desc",
    });

    const { data } = await supabaseRequest<DbSuggestionRow[]>(
      `suggestions?${query.toString()}`
    );

    const rows = data ?? [];
    return rows.map(mapSuggestion);
  },

  async listAdminSuggestions() {
    const query = new URLSearchParams({
      select: "id,user_id,title,area,summary,impact,status,admin_note,created_at,updated_at,users(id,email,name,job_role)",
      order: "created_at.desc",
    });

    const { data } = await supabaseRequest<DbSuggestionWithUserRow[]>(
      `suggestions?${query.toString()}`
    );

    const rows = data ?? [];
    return rows.map((item) => ({
      ...mapSuggestion(item),
      updatedAt: item.updated_at,
      user: {
        id: item.user_id,
        name: item.users?.name ?? "Unknown user",
        email: item.users?.email ?? "unknown@example.com",
        role: item.users?.job_role ?? "Unknown role",
      },
    } satisfies AdminSuggestionRecord));
  },

  async updateSuggestionStatus(input: {
    suggestionId: string;
    status: SuggestionStatus;
    adminNote: string;
  }) {
    const query = new URLSearchParams({
      id: `eq.${input.suggestionId}`,
    });

    await supabaseRequest(
      `suggestions?${query.toString()}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: input.status,
          admin_note: input.adminNote.trim(),
          updated_at: new Date().toISOString(),
        }),
      },
      {
        prefer: "return=minimal",
        allowEmpty: true,
      }
    );
  },

  async getAdminCounts() {
    const suggestions = await this.listAdminSuggestions();

    return {
      total: suggestions.length,
      new: suggestions.filter((item) => item.status === "NEW").length,
      reviewing: suggestions.filter((item) => item.status === "REVIEWING").length,
      planned: suggestions.filter((item) => item.status === "PLANNED").length,
      shipped: suggestions.filter((item) => item.status === "SHIPPED").length,
      rejected: suggestions.filter((item) => item.status === "REJECTED").length,
    };
  },

  async setTotpSecret(userId: string, secret: string) {
    const query = new URLSearchParams({ id: `eq.${userId}`, select: USER_SELECT });
    const { data } = await supabaseRequest<DbUserRow[]>(
      `users?${query.toString()}`,
      { method: "PATCH", body: JSON.stringify({ totp_secret: secret, totp_enabled: false, updated_at: new Date().toISOString() }) },
      { prefer: "return=representation" }
    );
    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async enableTotp(userId: string) {
    const query = new URLSearchParams({ id: `eq.${userId}`, select: USER_SELECT });
    const { data } = await supabaseRequest<DbUserRow[]>(
      `users?${query.toString()}`,
      { method: "PATCH", body: JSON.stringify({ totp_enabled: true, updated_at: new Date().toISOString() }) },
      { prefer: "return=representation" }
    );
    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async disableTotp(userId: string) {
    const query = new URLSearchParams({ id: `eq.${userId}`, select: USER_SELECT });
    const { data } = await supabaseRequest<DbUserRow[]>(
      `users?${query.toString()}`,
      { method: "PATCH", body: JSON.stringify({ totp_secret: null, totp_enabled: false, updated_at: new Date().toISOString() }) },
      { prefer: "return=representation" }
    );
    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async updatePassword(userId: string, newPasswordHash: string) {
    const query = new URLSearchParams({
      id: `eq.${userId}`,
      select: USER_SELECT,
    });

    const { data } = await supabaseRequest<DbUserRow[]>(
      `users?${query.toString()}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        }),
      },
      { prefer: "return=representation" }
    );

    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async uploadAvatar(userId: string, data: ArrayBuffer, contentType: string) {
    assertSupabaseEnv();
    const ext = contentType.split("/")[1] ?? "jpg";
    const path = `${userId}.${ext}`;

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/avatars/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: data,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Avatar upload failed: ${response.status} ${text}`);
    }

    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
  },

  async deleteUser(userId: string): Promise<void> {
    await supabaseRequest(`users?id=eq.${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }, { allowEmpty: true });
  },

  // ── Fitness: profile ───────────────────────────────────────

  async getFitnessProfile(userId: string): Promise<FitnessProfile | null> {
    const { data } = await supabaseRequest<{
      user_id: string;
      monthly_gym_cost: number;
      fitness_goal: FitnessGoal;
      fitness_badge: string;
    }[]>(`fitness_profile?user_id=eq.${encodeURIComponent(userId)}&select=*`, {}, { allowEmpty: true });
    const row = data?.[0];
    if (!row) return null;
    return {
      userId: row.user_id,
      monthlyGymCost: row.monthly_gym_cost,
      fitnessGoal: row.fitness_goal,
      fitnessBadge: row.fitness_badge,
    };
  },

  async upsertFitnessProfile(userId: string, patch: Partial<Omit<FitnessProfile, "userId">>): Promise<void> {
    await supabaseRequest("fitness_profile", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        ...(patch.monthlyGymCost !== undefined && { monthly_gym_cost: patch.monthlyGymCost }),
        ...(patch.fitnessGoal   !== undefined && { fitness_goal:      patch.fitnessGoal   }),
        ...(patch.fitnessBadge  !== undefined && { fitness_badge:     patch.fitnessBadge  }),
      }),
    }, { prefer: "resolution=merge-duplicates", allowEmpty: true });
  },

  // ── Fitness: supplements ───────────────────────────────────

  async listSupplements(userId: string): Promise<Supplement[]> {
    const { data } = await supabaseRequest<{
      id: string; user_id: string; name: string;
      total_weight_g: number; serving_size_g: number; servings_per_day: number;
      price: number; purchase_date: string; notes: string | null;
      created_at: string; updated_at: string;
    }[]>(`supplements?user_id=eq.${encodeURIComponent(userId)}&order=purchase_date.desc&select=*`, {}, { allowEmpty: true });
    return (data ?? []).map((r) => ({
      id: r.id, userId: r.user_id, name: r.name,
      totalWeightG: r.total_weight_g, servingSizeG: r.serving_size_g,
      servingsPerDay: r.servings_per_day, price: r.price,
      purchaseDate: r.purchase_date, notes: r.notes,
      createdAt: r.created_at, updatedAt: r.updated_at,
    }));
  },

  async createSupplement(userId: string, s: Omit<Supplement, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Supplement> {
    const id = randomUUID();
    const { data } = await supabaseRequest<{
      id: string; user_id: string; name: string;
      total_weight_g: number; serving_size_g: number; servings_per_day: number;
      price: number; purchase_date: string; notes: string | null;
      created_at: string; updated_at: string;
    }[]>("supplements", {
      method: "POST",
      body: JSON.stringify({
        id, user_id: userId, name: s.name,
        total_weight_g: s.totalWeightG, serving_size_g: s.servingSizeG,
        servings_per_day: s.servingsPerDay, price: s.price,
        purchase_date: s.purchaseDate, notes: s.notes ?? null,
      }),
    }, { prefer: "return=representation" });
    const r = data![0];
    return {
      id: r.id, userId: r.user_id, name: r.name,
      totalWeightG: r.total_weight_g, servingSizeG: r.serving_size_g,
      servingsPerDay: r.servings_per_day, price: r.price,
      purchaseDate: r.purchase_date, notes: r.notes,
      createdAt: r.created_at, updatedAt: r.updated_at,
    };
  },

  async updateSupplement(id: string, userId: string, patch: Partial<Omit<Supplement, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<void> {
    await supabaseRequest(
      `supplements?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          ...(patch.name            !== undefined && { name:             patch.name            }),
          ...(patch.totalWeightG    !== undefined && { total_weight_g:   patch.totalWeightG    }),
          ...(patch.servingSizeG    !== undefined && { serving_size_g:   patch.servingSizeG    }),
          ...(patch.servingsPerDay  !== undefined && { servings_per_day: patch.servingsPerDay  }),
          ...(patch.price           !== undefined && { price:            patch.price           }),
          ...(patch.purchaseDate    !== undefined && { purchase_date:    patch.purchaseDate    }),
          ...(patch.notes           !== undefined && { notes:            patch.notes           }),
        }),
      },
      { allowEmpty: true }
    );
  },

  async deleteSupplement(id: string, userId: string): Promise<void> {
    await supabaseRequest(
      `supplements?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
      { method: "DELETE" },
      { allowEmpty: true }
    );
  },

  async getSupplementStatuses(userId: string): Promise<SupplementStatus[]> {
    const { data } = await supabaseRequest<{
      id: string; name: string; remaining_pct: number; remaining_g: number;
      days_left: number; depletion_date: string; cost_per_serving: number;
    }[]>(
      `rpc/supplement_statuses`,
      { method: "POST", body: JSON.stringify({ p_user_id: userId }) },
      { allowEmpty: true }
    );
    return (data ?? []).map((r) => ({
      id: r.id, name: r.name, remainingPct: r.remaining_pct,
      remainingG: r.remaining_g, daysLeft: r.days_left,
      depletionDate: r.depletion_date, costPerServing: r.cost_per_serving,
    }));
  },

  // ── Fitness: gym sessions ──────────────────────────────────

  async listGymSessions(userId: string, limit = 50): Promise<GymSession[]> {
    const { data } = await supabaseRequest<{
      id: string; user_id: string; date: string; duration_min: number;
      workout_type: WorkoutType; volume_kg: number; exercises: Exercise[];
      notes: string | null; created_at: string; updated_at: string;
    }[]>(
      `gym_sessions?user_id=eq.${encodeURIComponent(userId)}&order=date.desc&limit=${limit}&select=*`,
      {},
      { allowEmpty: true }
    );
    return (data ?? []).map((r) => ({
      id: r.id, userId: r.user_id, date: r.date,
      durationMin: r.duration_min, workoutType: r.workout_type,
      volumeKg: r.volume_kg, exercises: r.exercises ?? [],
      notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at,
    }));
  },

  async createGymSession(userId: string, s: Omit<GymSession, "id" | "userId" | "createdAt" | "updatedAt">): Promise<GymSession> {
    const id = randomUUID();
    const { data } = await supabaseRequest<{
      id: string; user_id: string; date: string; duration_min: number;
      workout_type: WorkoutType; volume_kg: number; exercises: Exercise[];
      notes: string | null; created_at: string; updated_at: string;
    }[]>("gym_sessions", {
      method: "POST",
      body: JSON.stringify({
        id, user_id: userId, date: s.date,
        duration_min: s.durationMin, workout_type: s.workoutType,
        volume_kg: s.volumeKg, exercises: s.exercises, notes: s.notes ?? null,
      }),
    }, { prefer: "return=representation" });
    const r = data![0];
    return {
      id: r.id, userId: r.user_id, date: r.date,
      durationMin: r.duration_min, workoutType: r.workout_type,
      volumeKg: r.volume_kg, exercises: r.exercises ?? [],
      notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at,
    };
  },

  async deleteGymSession(id: string, userId: string): Promise<void> {
    await supabaseRequest(
      `gym_sessions?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
      { method: "DELETE" },
      { allowEmpty: true }
    );
  },

  async getGymRoi(userId: string, month: string): Promise<GymRoi | null> {
    const { data } = await supabaseRequest<{
      sessions_count: number; monthly_cost: number; cost_per_session: number;
    }[]>(
      "rpc/gym_roi",
      { method: "POST", body: JSON.stringify({ p_user_id: userId, p_month: month }) },
      { allowEmpty: true }
    );
    const r = data?.[0];
    if (!r) return null;
    return {
      sessionsCount: r.sessions_count,
      monthlyCost: r.monthly_cost,
      costPerSession: r.cost_per_session,
    };
  },
};
