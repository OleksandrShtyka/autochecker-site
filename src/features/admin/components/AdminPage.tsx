"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SUGGESTION_STATUS_OPTIONS } from "@/features/home/data";
import { useTheme } from "@/features/home/hooks/useTheme";
import { useToastQueue } from "@/features/home/hooks/useToastQueue";
import homeStyles from "@/features/home/styles";
import type { AdminSuggestionRecord, SuggestionStatus } from "@/features/home/types";
import { cx } from "@/features/home/utils";
import { ToastStack } from "@/features/home/components/ToastStack";

type AdminPayload = {
  ok: true;
  viewer: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
  };
  counts: {
    total: number;
    new: number;
    reviewing: number;
    planned: number;
    shipped: number;
    rejected: number;
  };
  suggestions: AdminSuggestionRecord[];
};

export function AdminPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { dismissToast, pushToast, toastLifetimeMs, toasts } = useToastQueue();
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [counts, setCounts] = useState<AdminPayload["counts"] | null>(null);
  const [suggestions, setSuggestions] = useState<AdminSuggestionRecord[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, SuggestionStatus>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const response = await fetch("/api/admin/overview", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        setIsForbidden(true);
        setIsLoading(false);
        return;
      }

      const payload = (await response.json()) as AdminPayload;
      setCounts(payload.counts);
      setSuggestions(payload.suggestions);
      setNotes(
        Object.fromEntries(
          payload.suggestions.map((item) => [item.id, item.adminNote ?? ""])
        )
      );
      setStatuses(
        Object.fromEntries(payload.suggestions.map((item) => [item.id, item.status]))
      );
      setIsForbidden(false);
      setIsLoading(false);
    };

    void load();
  }, []);

  const saveSuggestion = async (suggestionId: string) => {
    const response = await fetch(`/api/admin/suggestions/${suggestionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        status: statuses[suggestionId],
        adminNote: notes[suggestionId] ?? "",
      }),
    });

    const payload = (await response.json()) as
      | AdminPayload
      | { message?: string };

    if (!response.ok || !("suggestions" in payload)) {
      pushToast({
        ok: false,
        title: "Admin save failed",
        description:
          ("message" in payload && payload.message) || "Could not update suggestion status.",
        tone: "error",
      });
      return;
    }

    setCounts(payload.counts);
    setSuggestions(payload.suggestions);
    setNotes(
      Object.fromEntries(payload.suggestions.map((item) => [item.id, item.adminNote ?? ""]))
    );
    setStatuses(
      Object.fromEntries(payload.suggestions.map((item) => [item.id, item.status]))
    );
    pushToast({
      ok: true,
      title: "Suggestion updated",
      description: "Admin status and note were saved to the backend.",
      tone: "success",
    });
  };

  return (
    <main className={homeStyles.main} data-theme={theme}>
      <div className={homeStyles.bgMesh} />
      <div className={homeStyles.noise} />
      <div className={homeStyles.lights}>
        <div className={cx(homeStyles.light, homeStyles.lightOne)} />
        <div className={cx(homeStyles.light, homeStyles.lightTwo)} />
        <div className={cx(homeStyles.light, homeStyles.lightThree)} />
      </div>

      <ToastStack
        lifetimeMs={toastLifetimeMs}
        onDismiss={dismissToast}
        toasts={toasts}
      />

      <section className={homeStyles.cabinetPage}>
        <div className={homeStyles.cabinetPageTopbar}>
          <button
            type="button"
            className={homeStyles.navGhost}
            onClick={() => router.push("/cabinet")}
          >
            Back to Cabinet
          </button>

          <div className={homeStyles.cabinetPageActions} />
        </div>

        {isLoading ? (
          <section className={homeStyles.cabinetPageGate}>
            <div className={homeStyles.cabinetPageGateCard}>
              <span className={homeStyles.sectionTag}>Loading</span>
              <h1 className={homeStyles.sectionTitle}>Preparing admin panel...</h1>
            </div>
          </section>
        ) : isForbidden ? (
          <section className={homeStyles.cabinetPageGate}>
            <div className={homeStyles.cabinetPageGateCard}>
              <span className={homeStyles.sectionTag}>Restricted</span>
              <h1 className={homeStyles.sectionTitle}>Admin access required.</h1>
              <p className={homeStyles.sectionSubtitle}>
                Увійди під адміністраторським акаунтом або зроби перший акаунт у системі.
              </p>
              <button
                type="button"
                className={homeStyles.btnPrimary}
                onClick={() => router.push("/")}
              >
                Go Home
              </button>
            </div>
          </section>
        ) : (
          <section className={homeStyles.cabinet}>
            <div className={homeStyles.cabinetShell}>
              <div className={homeStyles.sectionHeader}>
                <span className={homeStyles.sectionTag}>Admin dashboard</span>
                <h1 className={homeStyles.sectionTitle}>
                  Suggestions inbox,
                  <span className={homeStyles.sectionMuted}> moderation and triage.</span>
                </h1>
                <p className={homeStyles.sectionSubtitle}>
                  Тут зібрані всі пропозиції користувачів із реальної бази даних. Можна
                  міняти статуси, додавати admin notes і вести backlog.
                </p>
              </div>

              <div className={homeStyles.adminStats}>
                <div className={homeStyles.adminStatCard}>
                  <span>Total</span>
                  <strong>{counts?.total ?? 0}</strong>
                </div>
                <div className={homeStyles.adminStatCard}>
                  <span>New</span>
                  <strong>{counts?.new ?? 0}</strong>
                </div>
                <div className={homeStyles.adminStatCard}>
                  <span>Reviewing</span>
                  <strong>{counts?.reviewing ?? 0}</strong>
                </div>
                <div className={homeStyles.adminStatCard}>
                  <span>Planned</span>
                  <strong>{counts?.planned ?? 0}</strong>
                </div>
                <div className={homeStyles.adminStatCard}>
                  <span>Shipped</span>
                  <strong>{counts?.shipped ?? 0}</strong>
                </div>
                <div className={homeStyles.adminStatCard}>
                  <span>Rejected</span>
                  <strong>{counts?.rejected ?? 0}</strong>
                </div>
              </div>

              <div className={homeStyles.adminList}>
                {suggestions.map((item) => (
                  <article key={item.id} className={homeStyles.adminItem}>
                    <div className={homeStyles.adminItemTop}>
                      <div>
                        <span className={homeStyles.cabinetEyebrow}>{item.area}</span>
                        <h3 className={homeStyles.adminItemTitle}>{item.title}</h3>
                        <p className={homeStyles.adminItemMeta}>
                          {item.user.name} · {item.user.email} · {item.user.role}
                        </p>
                      </div>
                      <span className={homeStyles.statusBadge}>{statuses[item.id] ?? item.status}</span>
                    </div>

                    <div className={homeStyles.adminContentGrid}>
                      <div className={homeStyles.adminContentBlock}>
                        <strong>What should change</strong>
                        <p>{item.summary}</p>
                      </div>
                      <div className={homeStyles.adminContentBlock}>
                        <strong>Why it matters</strong>
                        <p>{item.impact}</p>
                      </div>
                    </div>

                    <div className={homeStyles.formGrid}>
                      <label className={homeStyles.field}>
                        <span className={homeStyles.fieldLabel}>Status</span>
                        <select
                          className={homeStyles.fieldInput}
                          value={statuses[item.id] ?? item.status}
                          onChange={(event) =>
                            setStatuses((current) => ({
                              ...current,
                              [item.id]: event.target.value as SuggestionStatus,
                            }))
                          }
                        >
                          {SUGGESTION_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={homeStyles.fieldWide}>
                        <span className={homeStyles.fieldLabel}>Admin note</span>
                        <textarea
                          className={homeStyles.fieldTextarea}
                          value={notes[item.id] ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Write internal review notes or a response summary."
                        />
                      </label>
                    </div>

                    <div className={homeStyles.adminItemFooter}>
                      <span className={homeStyles.historyDate}>
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        className={homeStyles.btnPrimary}
                        onClick={() => void saveSuggestion(item.id)}
                      >
                        Save status
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
