"use client";

import { useRouter } from "next/navigation";
import {
  CABINET_ROLE_OPTIONS,
  FEATURES,
  GITHUB,
  IMPROVEMENT_AREAS,
} from "../data";
import { useCabinet } from "../hooks/useCabinet";
import { useTheme } from "../hooks/useTheme";
import { useToastQueue } from "../hooks/useToastQueue";
import styles from "../styles";
import { cx } from "../utils";
import { CabinetDashboard } from "./CabinetDashboard";
import { ToastStack } from "./ToastStack";

export function CabinetPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { dismissToast, pushToast, toastLifetimeMs, toasts } = useToastQueue();
  const {
    authMessage,
    history,
    isAdmin,
    isAuthenticated,
    isBooting,
    logout,
    profile,
    setProfileField,
    setSuggestionField,
    submitSuggestion,
    suggestion,
  } = useCabinet({
    features: FEATURES,
  });

  const handleLogout = async () => {
    const feedback = await logout();
    pushToast(feedback);
    router.push("/");
  };

  const handleSubmitSuggestion = async () => {
    const feedback = await submitSuggestion();
    pushToast(feedback);
  };

  return (
    <main className={styles.main} data-theme={theme}>
      <div className={styles.bgMesh} />
      <div className={styles.noise} />
      <div className={styles.lights}>
        <div className={cx(styles.light, styles.lightOne)} />
        <div className={cx(styles.light, styles.lightTwo)} />
        <div className={cx(styles.light, styles.lightThree)} />
      </div>
      <ToastStack
        lifetimeMs={toastLifetimeMs}
        onDismiss={dismissToast}
        toasts={toasts}
      />

      <section className={styles.cabinetPage}>
        <div className={styles.cabinetPageTopbar}>
          <button
            type="button"
            className={styles.navGhost}
            onClick={() => router.push("/")}
          >
            Back Home
          </button>

          <div className={styles.cabinetPageActions}>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <span className={styles.themeToggleTrack}>
                <span
                  className={cx(
                    styles.themeToggleThumb,
                    theme === "dark" && styles.themeToggleThumbDark
                  )}
                />
              </span>
              <span className={styles.themeToggleLabel}>
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>

            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <button
                    type="button"
                    className={styles.navGhost}
                    onClick={() => router.push("/admin")}
                  >
                    Admin Panel
                  </button>
                ) : null}
                <button type="button" className={styles.navCta} onClick={() => void handleLogout()}>
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>

        {isBooting ? (
          <section className={styles.cabinetPageGate}>
            <div className={styles.cabinetPageGateCard}>
              <span className={styles.sectionTag}>Loading</span>
              <h1 className={styles.sectionTitle}>Checking your session...</h1>
            </div>
          </section>
        ) : isAuthenticated ? (
          <>
            <CabinetDashboard
              features={FEATURES}
              profile={profile}
              suggestion={suggestion}
              history={history}
              roleOptions={CABINET_ROLE_OPTIONS}
              areaOptions={IMPROVEMENT_AREAS}
              onProfileFieldChange={setProfileField}
              onSuggestionFieldChange={setSuggestionField}
              onSubmitSuggestion={() => void handleSubmitSuggestion()}
            />
            {authMessage ? <p className={styles.authMessage}>{authMessage}</p> : null}
          </>
        ) : (
          <section className={styles.cabinetPageGate}>
            <div className={styles.cabinetPageGateCard}>
              <span className={styles.sectionTag}>Authorization required</span>
              <h1 className={styles.sectionTitle}>
                Cabinet dashboard lives here,
                <span className={styles.sectionMuted}> but sign-in starts on the main page.</span>
              </h1>
              <p className={styles.sectionSubtitle}>
                Повернись на головну сторінку, відкрий вікно авторизації або реєстрації
                і після входу знову зайди в cabinet.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => router.push("/")}
              >
                Go to main page
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
