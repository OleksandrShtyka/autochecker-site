"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../hooks/useTheme";
import { useFitness } from "../hooks/useFitness";
import styles from "../styles";
import fitnessStyles from "../styles/fitness.module.css";
import { cx } from "../utils";
import type { Exercise, WorkoutType } from "../types";

const GOALS = [
  { value: "general",     label: "General Fitness" },
  { value: "strength",    label: "Strength" },
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "endurance",   label: "Endurance" },
] as const;

const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: "push",       label: "Push" },
  { value: "pull",       label: "Pull" },
  { value: "legs",       label: "Legs" },
  { value: "upper",      label: "Upper" },
  { value: "lower",      label: "Lower" },
  { value: "full_body",  label: "Full Body" },
  { value: "cardio",     label: "Cardio" },
  { value: "other",      label: "Other" },
];

function CircleProgress({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  const color = pct > 40 ? "#2ec8be" : pct > 15 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className={fitnessStyles.circle}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-border)" strokeWidth="5" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="36" y="41" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export function FitnessPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const suppModalRef = useRef<HTMLDivElement>(null);
  const sessModalRef = useRef<HTMLDivElement>(null);

  const {
    supplements, statuses, sessions, roi, loading, error,
    profileDraft, setProfileDraft, saveProfile, profileError,
    suppForm, setSuppForm, suppEditId, suppModalOpen, setSuppModalOpen,
    openAddSupp, openEditSupp, submitSupp, deleteSupp, suppError,
    sessForm, setSessForm, sessModalOpen, setSessModalOpen,
    openAddSession, submitSession, deleteSession, sessError,
    addExercise, updateExercise, removeExercise,
  } = useFitness();

  useEffect(() => { setIsMounted(true); }, []);

  // close modals on outside click
  useEffect(() => {
    if (!suppModalOpen && !sessModalOpen) return;
    const handler = (e: MouseEvent) => {
      if (suppModalOpen && suppModalRef.current && !suppModalRef.current.contains(e.target as Node)) {
        setSuppModalOpen(false);
      }
      if (sessModalOpen && sessModalRef.current && !sessModalRef.current.contains(e.target as Node)) {
        setSessModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [suppModalOpen, sessModalOpen, setSuppModalOpen, setSessModalOpen]);

  const handleSaveProfile = async () => {
    await saveProfile();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const statusMap = Object.fromEntries(statuses.map((s) => [s.id, s]));

  if (!isMounted) return null;

  return (
    <main className={styles.main} data-theme={theme}>
      <div className={styles.bgMesh} />
      <div className={styles.noise} />
      <div className={styles.lights}>
        <div className={cx(styles.light, styles.lightOne)} />
        <div className={cx(styles.light, styles.lightTwo)} />
        <div className={cx(styles.light, styles.lightThree)} />
      </div>

      <section className={styles.cabinetPage}>
        {/* topbar */}
        <div className={styles.cabinetPageTopbar}>
          <button type="button" className={styles.btnBack} onClick={() => router.push("/cabinet")}>
            <span className={styles.btnBackArrow}>←</span>
            Cabinet
          </button>
          <span className={fitnessStyles.pageTitle}>
            <span className={fitnessStyles.pageTitleIcon}>🏋️</span>
            Fitness Tracker
          </span>
        </div>

        {loading ? (
          <div className={fitnessStyles.loadingState}>Loading fitness data...</div>
        ) : error ? (
          <div className={fitnessStyles.errorState}>{error}</div>
        ) : (
          <div className={fitnessStyles.shell}>

            {/* ── ROI banner ── */}
            {roi && (
              <div className={fitnessStyles.roiBanner}>
                <div className={fitnessStyles.roiStat}>
                  <span className={fitnessStyles.roiValue}>{roi.sessionsCount}</span>
                  <span className={fitnessStyles.roiLabel}>sessions this month</span>
                </div>
                <div className={fitnessStyles.roiDivider} />
                <div className={fitnessStyles.roiStat}>
                  <span className={fitnessStyles.roiValue}>${roi.monthlyCost}</span>
                  <span className={fitnessStyles.roiLabel}>gym cost</span>
                </div>
                <div className={fitnessStyles.roiDivider} />
                <div className={fitnessStyles.roiStat}>
                  <span className={fitnessStyles.roiValue}>${roi.costPerSession}</span>
                  <span className={fitnessStyles.roiLabel}>cost per session</span>
                </div>
              </div>
            )}

            {/* ── Profile card ── */}
            <div className={fitnessStyles.card}>
              <div className={fitnessStyles.cardHead}>
                <span className={fitnessStyles.cardEyebrow}>Fitness Profile</span>
                <strong>Goals &amp; Gym Settings</strong>
              </div>
              <div className={fitnessStyles.profileGrid}>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Monthly gym cost ($)</span>
                  <input
                    type="number" min="0" step="0.01"
                    className={fitnessStyles.fieldInput}
                    value={profileDraft.monthlyGymCost}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, monthlyGymCost: e.target.value }))}
                  />
                </label>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Fitness goal</span>
                  <select
                    className={fitnessStyles.fieldInput}
                    value={profileDraft.fitnessGoal}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, fitnessGoal: e.target.value as typeof p.fitnessGoal }))}
                  >
                    {GOALS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </label>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Badge / level</span>
                  <input
                    className={fitnessStyles.fieldInput}
                    value={profileDraft.fitnessBadge}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, fitnessBadge: e.target.value }))}
                    placeholder="Beginner"
                  />
                </label>
              </div>
              <button
                type="button"
                className={cx(fitnessStyles.btnPrimary, profileSaved ? fitnessStyles.btnSaved : "")}
                onClick={() => void handleSaveProfile()}
              >
                {profileSaved ? "Saved ✓" : "Save profile"}
              </button>
              {profileError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>{profileError}</p>}
            </div>

            {/* ── Supplements ── */}
            <div className={fitnessStyles.sectionHead}>
              <h2 className={fitnessStyles.sectionTitle}>Supplements</h2>
              <button type="button" className={fitnessStyles.btnAdd} onClick={openAddSupp}>
                + Add supplement
              </button>
            </div>

            {supplements.length === 0 ? (
              <div className={fitnessStyles.emptyState}>
                No supplements tracked yet. Click &quot;Add supplement&quot; to start.
              </div>
            ) : (
              <div className={fitnessStyles.suppGrid}>
                {supplements.map((s) => {
                  const st = statusMap[s.id];
                  return (
                    <div key={s.id} className={fitnessStyles.suppCard}>
                      <div className={fitnessStyles.suppCardLeft}>
                        {st ? <CircleProgress pct={st.remainingPct} /> : null}
                      </div>
                      <div className={fitnessStyles.suppCardBody}>
                        <strong className={fitnessStyles.suppName}>{s.name}</strong>
                        {st ? (
                          <>
                            <span className={fitnessStyles.suppStat}>{st.remainingG.toFixed(0)}g left · {st.daysLeft}d</span>
                            <span className={fitnessStyles.suppStat}>Depletes {st.depletionDate}</span>
                            <span className={fitnessStyles.suppStat}>${st.costPerServing}/serving</span>
                          </>
                        ) : null}
                      </div>
                      <div className={fitnessStyles.suppCardActions}>
                        <button type="button" className={fitnessStyles.iconBtn} onClick={() => openEditSupp(s)} title="Edit">✎</button>
                        <button type="button" className={cx(fitnessStyles.iconBtn, fitnessStyles.iconBtnDanger)} onClick={() => void deleteSupp(s.id)} title="Delete">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Gym Sessions ── */}
            <div className={fitnessStyles.sectionHead}>
              <h2 className={fitnessStyles.sectionTitle}>Gym Sessions</h2>
              <button type="button" className={fitnessStyles.btnAdd} onClick={openAddSession}>
                + Log session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className={fitnessStyles.emptyState}>
                No sessions logged yet. Click &quot;Log session&quot; to start.
              </div>
            ) : (
              <div className={fitnessStyles.sessTable}>
                <div className={fitnessStyles.sessTableHead}>
                  <span>Date</span>
                  <span>Type</span>
                  <span>Duration</span>
                  <span>Volume</span>
                  <span>Exercises</span>
                  <span />
                </div>
                {sessions.map((s) => (
                  <div key={s.id} className={fitnessStyles.sessRow}>
                    <span>{s.date}</span>
                    <span className={fitnessStyles.sessType}>{s.workoutType.replace("_", " ")}</span>
                    <span>{s.durationMin} min</span>
                    <span>{s.volumeKg > 0 ? `${s.volumeKg} kg` : "—"}</span>
                    <span>{s.exercises.length} ex.</span>
                    <button
                      type="button"
                      className={cx(fitnessStyles.iconBtn, fitnessStyles.iconBtnDanger)}
                      onClick={() => void deleteSession(s.id)}
                      title="Delete"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Supplement modal ── */}
      {suppModalOpen && (
        <div className={fitnessStyles.modalBackdrop}>
          <div className={fitnessStyles.modal} ref={suppModalRef}>
            <div className={fitnessStyles.modalHead}>
              <strong>{suppEditId ? "Edit supplement" : "Add supplement"}</strong>
              <button type="button" className={fitnessStyles.modalClose} onClick={() => setSuppModalOpen(false)}>✕</button>
            </div>
            <div className={fitnessStyles.modalBody}>
              <label className={fitnessStyles.field}>
                <span className={fitnessStyles.fieldLabel}>Name</span>
                <input className={fitnessStyles.fieldInput} value={suppForm.name}
                  onChange={(e) => setSuppForm((p) => ({ ...p, name: e.target.value }))} placeholder="Whey Protein" />
              </label>
              <div className={fitnessStyles.modalRow}>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Total weight (g)</span>
                  <input type="number" className={fitnessStyles.fieldInput} value={suppForm.totalWeightG}
                    onChange={(e) => setSuppForm((p) => ({ ...p, totalWeightG: e.target.value }))} placeholder="1000" />
                </label>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Serving size (g)</span>
                  <input type="number" className={fitnessStyles.fieldInput} value={suppForm.servingSizeG}
                    onChange={(e) => setSuppForm((p) => ({ ...p, servingSizeG: e.target.value }))} placeholder="30" />
                </label>
              </div>
              <div className={fitnessStyles.modalRow}>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Servings / day</span>
                  <input type="number" className={fitnessStyles.fieldInput} value={suppForm.servingsPerDay}
                    onChange={(e) => setSuppForm((p) => ({ ...p, servingsPerDay: e.target.value }))} placeholder="1" />
                </label>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Price ($)</span>
                  <input type="number" className={fitnessStyles.fieldInput} value={suppForm.price}
                    onChange={(e) => setSuppForm((p) => ({ ...p, price: e.target.value }))} placeholder="0" />
                </label>
              </div>
              <label className={fitnessStyles.field}>
                <span className={fitnessStyles.fieldLabel}>Purchase date</span>
                <input type="date" className={fitnessStyles.fieldInput} value={suppForm.purchaseDate}
                  onChange={(e) => setSuppForm((p) => ({ ...p, purchaseDate: e.target.value }))} />
              </label>
              <label className={fitnessStyles.field}>
                <span className={fitnessStyles.fieldLabel}>Notes (optional)</span>
                <input className={fitnessStyles.fieldInput} value={suppForm.notes}
                  onChange={(e) => setSuppForm((p) => ({ ...p, notes: e.target.value }))} placeholder="..." />
              </label>
            </div>
            {suppError && <p style={{ color: "#ef4444", fontSize: 13, padding: "0 20px 8px" }}>{suppError}</p>}
            <div className={fitnessStyles.modalFoot}>
              <button type="button" className={fitnessStyles.btnSecondary} onClick={() => setSuppModalOpen(false)}>Cancel</button>
              <button type="button" className={fitnessStyles.btnPrimary} onClick={() => void submitSupp()}
                disabled={!suppForm.name || !suppForm.totalWeightG || !suppForm.servingSizeG}>
                {suppEditId ? "Save changes" : "Add supplement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Session modal ── */}
      {sessModalOpen && (
        <div className={fitnessStyles.modalBackdrop}>
          <div className={cx(fitnessStyles.modal, fitnessStyles.modalWide)} ref={sessModalRef}>
            <div className={fitnessStyles.modalHead}>
              <strong>Log gym session</strong>
              <button type="button" className={fitnessStyles.modalClose} onClick={() => setSessModalOpen(false)}>✕</button>
            </div>
            <div className={fitnessStyles.modalBody}>
              <div className={fitnessStyles.modalRow}>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Date</span>
                  <input type="date" className={fitnessStyles.fieldInput} value={sessForm.date}
                    onChange={(e) => setSessForm((p) => ({ ...p, date: e.target.value }))} />
                </label>
                <label className={fitnessStyles.field}>
                  <span className={fitnessStyles.fieldLabel}>Duration (min)</span>
                  <input type="number" className={fitnessStyles.fieldInput} value={sessForm.durationMin}
                    onChange={(e) => setSessForm((p) => ({ ...p, durationMin: e.target.value }))} placeholder="60" />
                </label>
              </div>
              <label className={fitnessStyles.field}>
                <span className={fitnessStyles.fieldLabel}>Workout type</span>
                <select className={fitnessStyles.fieldInput} value={sessForm.workoutType}
                  onChange={(e) => setSessForm((p) => ({ ...p, workoutType: e.target.value as WorkoutType }))}>
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className={fitnessStyles.field}>
                <span className={fitnessStyles.fieldLabel}>Notes (optional)</span>
                <input className={fitnessStyles.fieldInput} value={sessForm.notes}
                  onChange={(e) => setSessForm((p) => ({ ...p, notes: e.target.value }))} placeholder="How did it feel?" />
              </label>

              {/* exercises */}
              <div className={fitnessStyles.exHead}>
                <span className={fitnessStyles.fieldLabel}>Exercises</span>
                <button type="button" className={fitnessStyles.btnAddSmall} onClick={addExercise}>+ Add</button>
              </div>
              {sessForm.exercises.length > 0 && (
                <div className={fitnessStyles.exList}>
                  {sessForm.exercises.map((ex, idx) => (
                    <div key={idx} className={fitnessStyles.exRow}>
                      <input className={cx(fitnessStyles.fieldInput, fitnessStyles.exName)}
                        value={ex.name} placeholder="Exercise name"
                        onChange={(e) => updateExercise(idx, { name: e.target.value })} />
                      <label className={fitnessStyles.exLabel}>
                        <span>Sets</span>
                        <input type="number" className={cx(fitnessStyles.fieldInput, fitnessStyles.exNum)}
                          value={ex.sets} min={1}
                          onChange={(e) => updateExercise(idx, { sets: parseInt(e.target.value) || 1 })} />
                      </label>
                      <label className={fitnessStyles.exLabel}>
                        <span>Reps</span>
                        <input type="number" className={cx(fitnessStyles.fieldInput, fitnessStyles.exNum)}
                          value={ex.reps} min={1}
                          onChange={(e) => updateExercise(idx, { reps: parseInt(e.target.value) || 1 })} />
                      </label>
                      <label className={fitnessStyles.exLabel}>
                        <span>kg</span>
                        <input type="number" className={cx(fitnessStyles.fieldInput, fitnessStyles.exNum)}
                          value={ex.weightKg} min={0} step={0.5}
                          onChange={(e) => updateExercise(idx, { weightKg: parseFloat(e.target.value) || 0 })} />
                      </label>
                      <button type="button" className={cx(fitnessStyles.iconBtn, fitnessStyles.iconBtnDanger)}
                        onClick={() => removeExercise(idx)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {sessError && <p style={{ color: "#ef4444", fontSize: 13, padding: "0 20px 8px" }}>{sessError}</p>}
            <div className={fitnessStyles.modalFoot}>
              <button type="button" className={fitnessStyles.btnSecondary} onClick={() => setSessModalOpen(false)}>Cancel</button>
              <button type="button" className={fitnessStyles.btnPrimary} onClick={() => void submitSession()}>
                Log session
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
