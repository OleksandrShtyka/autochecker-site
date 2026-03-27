"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  FitnessGoal,
  FitnessProfile,
  GymRoi,
  GymSession,
  Supplement,
  SupplementStatus,
  WorkoutType,
  Exercise,
} from "../types";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const text = await res.text();
  if (!text) return {} as T;
  const json = JSON.parse(text) as T & { message?: string };
  if (!res.ok) {
    throw new Error((json as { message?: string }).message ?? `Request failed: ${res.status}`);
  }
  return json;
}

export type SupplementDraft = {
  name: string;
  totalWeightG: string;
  servingSizeG: string;
  servingsPerDay: string;
  price: string;
  purchaseDate: string;
  notes: string;
};

export type SessionDraft = {
  date: string;
  durationMin: string;
  workoutType: WorkoutType;
  notes: string;
  exercises: Exercise[];
};

const today = () => new Date().toISOString().slice(0, 10);

export const BLANK_SUPPLEMENT: SupplementDraft = {
  name: "", totalWeightG: "", servingSizeG: "", servingsPerDay: "1",
  price: "0", purchaseDate: today(), notes: "",
};

export const BLANK_SESSION: SessionDraft = {
  date: today(), durationMin: "60", workoutType: "full_body", notes: "", exercises: [],
};

export function useFitness() {
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [statuses, setStatuses] = useState<SupplementStatus[]>([]);
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [roi, setRoi] = useState<GymRoi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── profile ──────────────────────────────────────────────────
  const [profileDraft, setProfileDraft] = useState({
    monthlyGymCost: "0",
    fitnessGoal: "general" as FitnessGoal,
    fitnessBadge: "Beginner",
  });

  // ── form errors ───────────────────────────────────────────────
  const [suppError, setSuppError] = useState<string | null>(null);
  const [sessError, setSessError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── supplement form ───────────────────────────────────────────
  const [suppForm, setSuppForm] = useState<SupplementDraft>(BLANK_SUPPLEMENT);
  const [suppEditId, setSuppEditId] = useState<string | null>(null);
  const [suppModalOpen, setSuppModalOpen] = useState(false);

  // ── session form ──────────────────────────────────────────────
  const [sessForm, setSessForm] = useState<SessionDraft>(BLANK_SESSION);
  const [sessModalOpen, setSessModalOpen] = useState(false);

  // ── load all data ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, suppRes, sessRes, roiRes] = await Promise.all([
        api<{ profile: FitnessProfile | null }>("/api/fitness/profile"),
        api<{ supplements: Supplement[]; statuses: SupplementStatus[] }>("/api/fitness/supplements"),
        api<{ sessions: GymSession[] }>("/api/fitness/sessions"),
        api<{ roi: GymRoi | null }>("/api/fitness/roi"),
      ]);
      const p = profRes.profile;
      setProfile(p);
      if (p) {
        setProfileDraft({
          monthlyGymCost: String(p.monthlyGymCost),
          fitnessGoal: p.fitnessGoal,
          fitnessBadge: p.fitnessBadge,
        });
      }
      setSupplements(suppRes.supplements ?? []);
      setStatuses(suppRes.statuses ?? []);
      setSessions(sessRes.sessions ?? []);
      setRoi(roiRes.roi);
    } catch {
      setError("Failed to load fitness data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── profile save ──────────────────────────────────────────────
  const saveProfile = useCallback(async () => {
    setProfileError(null);
    try {
      const res = await api<{ profile: FitnessProfile }>("/api/fitness/profile", {
        method: "PATCH",
        body: JSON.stringify({
          monthlyGymCost: parseFloat(profileDraft.monthlyGymCost) || 0,
          fitnessGoal: profileDraft.fitnessGoal,
          fitnessBadge: profileDraft.fitnessBadge,
        }),
      });
      setProfile(res.profile);
      const roiRes = await api<{ roi: GymRoi | null }>("/api/fitness/roi");
      setRoi(roiRes.roi);
      return { ok: true };
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to save profile.");
      return { ok: false };
    }
  }, [profileDraft]);

  // ── supplement CRUD ───────────────────────────────────────────
  const openAddSupp = useCallback(() => {
    setSuppForm({ ...BLANK_SUPPLEMENT, purchaseDate: today() });
    setSuppEditId(null);
    setSuppModalOpen(true);
  }, []);

  const openEditSupp = useCallback((s: Supplement) => {
    setSuppForm({
      name: s.name,
      totalWeightG: String(s.totalWeightG),
      servingSizeG: String(s.servingSizeG),
      servingsPerDay: String(s.servingsPerDay),
      price: String(s.price),
      purchaseDate: s.purchaseDate,
      notes: s.notes ?? "",
    });
    setSuppEditId(s.id);
    setSuppModalOpen(true);
  }, []);

  const submitSupp = useCallback(async () => {
    setSuppError(null);
    const payload = {
      name: suppForm.name,
      totalWeightG: parseFloat(suppForm.totalWeightG),
      servingSizeG: parseFloat(suppForm.servingSizeG),
      servingsPerDay: parseFloat(suppForm.servingsPerDay),
      price: parseFloat(suppForm.price) || 0,
      purchaseDate: suppForm.purchaseDate,
      notes: suppForm.notes || null,
    };

    try {
      if (suppEditId) {
        await api(`/api/fitness/supplements/${suppEditId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/fitness/supplements", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      const res = await api<{ supplements: Supplement[]; statuses: SupplementStatus[] }>("/api/fitness/supplements");
      setSupplements(res.supplements ?? []);
      setStatuses(res.statuses ?? []);
      setSuppModalOpen(false);
    } catch (e) {
      console.error("[submitSupp]", e);
      setSuppError(e instanceof Error ? e.message : "Failed to save supplement.");
    }
  }, [suppForm, suppEditId]);

  const deleteSupp = useCallback(async (id: string) => {
    await api(`/api/fitness/supplements/${id}`, { method: "DELETE" });
    setSupplements((prev) => prev.filter((s) => s.id !== id));
    setStatuses((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── session CRUD ──────────────────────────────────────────────
  const openAddSession = useCallback(() => {
    setSessForm({ ...BLANK_SESSION, date: today() });
    setSessModalOpen(true);
  }, []);

  const submitSession = useCallback(async () => {
    setSessError(null);
    const volumeKg = sessForm.exercises.reduce(
      (sum, ex) => sum + ex.sets * ex.reps * ex.weightKg, 0
    );
    try {
      await api("/api/fitness/sessions", {
        method: "POST",
        body: JSON.stringify({
          date: sessForm.date,
          durationMin: parseInt(sessForm.durationMin) || 60,
          workoutType: sessForm.workoutType,
          volumeKg,
          exercises: sessForm.exercises,
          notes: sessForm.notes || null,
        }),
      });
      const res = await api<{ sessions: GymSession[] }>("/api/fitness/sessions");
      setSessions(res.sessions ?? []);
      const roiRes = await api<{ roi: GymRoi | null }>("/api/fitness/roi");
      setRoi(roiRes.roi);
      setSessModalOpen(false);
    } catch (e) {
      console.error("[submitSession]", e);
      setSessError(e instanceof Error ? e.message : "Failed to save session.");
    }
  }, [sessForm]);

  const deleteSession = useCallback(async (id: string) => {
    await api(`/api/fitness/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    const roiRes = await api<{ roi: GymRoi | null }>("/api/fitness/roi");
    setRoi(roiRes.roi);
  }, []);

  // ── exercise helpers ──────────────────────────────────────────
  const addExercise = useCallback(() => {
    setSessForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { name: "", sets: 3, reps: 10, weightKg: 0 }],
    }));
  }, []);

  const updateExercise = useCallback((idx: number, patch: Partial<Exercise>) => {
    setSessForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === idx ? { ...ex, ...patch } : ex),
    }));
  }, []);

  const removeExercise = useCallback((idx: number) => {
    setSessForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== idx),
    }));
  }, []);

  return {
    // data
    profile, supplements, statuses, sessions, roi, loading, error,
    // profile
    profileDraft, setProfileDraft, saveProfile, profileError,
    // supplement modal
    suppForm, setSuppForm, suppEditId, suppModalOpen, setSuppModalOpen,
    openAddSupp, openEditSupp, submitSupp, deleteSupp, suppError,
    // session modal
    sessForm, setSessForm, sessModalOpen, setSessModalOpen,
    openAddSession, submitSession, deleteSession, sessError,
    // exercises
    addExercise, updateExercise, removeExercise,
  };
}
