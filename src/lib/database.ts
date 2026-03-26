import { randomUUID } from "node:crypto";
import type {
  AdminSuggestionRecord,
  CabinetProfile,
  SessionUser,
  SuggestionDraft,
  SuggestionRecord,
  SuggestionStatus,
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

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

function mapUser(row: DbUserRow): SessionUser & { passwordHash: string; profile: CabinetProfile } {
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

async function findUsersByIds(userIds: string[]) {
  if (!userIds.length) {
    return [];
  }

  const safeIds = userIds.filter((id) => UUID_RE.test(id));
  if (!safeIds.length) {
    return [];
  }

  const inFilter = safeIds.join(",");
  const query = new URLSearchParams({
    select: "id,email,name,password_hash,auth_role,usage,favorite_feature,job_role,created_at,updated_at",
    id: `in.(${inFilter})`,
  });

  const { data } = await supabaseRequest<DbUserRow[]>(`users?${query.toString()}`);
  const rows = data ?? [];
  return rows.map(mapUser);
}

export const database = {
  async findUserByEmail(email: string) {
    const query = new URLSearchParams({
      select: "id,email,name,password_hash,auth_role,usage,favorite_feature,job_role,created_at,updated_at",
      email: `eq.${email}`,
      limit: "1",
    });

    const { data } = await supabaseRequest<DbUserRow[]>(`users?${query.toString()}`);
    const rows = data ?? [];
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async findUserById(id: string) {
    const query = new URLSearchParams({
      select: "id,email,name,password_hash,auth_role,usage,favorite_feature,job_role,created_at,updated_at",
      id: `eq.${id}`,
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
      select: "id,email,name,password_hash,auth_role,usage,favorite_feature,job_role,created_at,updated_at",
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
};
