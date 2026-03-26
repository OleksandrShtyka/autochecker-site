"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CABINET_ROLE_OPTIONS,
  FEATURES,
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
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const { dismissToast, pushToast, toastLifetimeMs, toasts } = useToastQueue();
  const {
    accountData,
    authMessage,
    history,
    isAdmin,
    isAuthenticated,
    isBooting,
    logout,
    profile,
    sessionUser,
    setProfileField,
    setSuggestionField,
    submitSuggestion,
    suggestion,
    uploadAvatar,
    removeAvatar,
    disconnectOAuth,
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

  const handleAvatarChange = async (file: File) => {
    const feedback = await uploadAvatar(file);
    pushToast(feedback);
  };

  const handleAvatarRemove = async () => {
    const feedback = await removeAvatar();
    pushToast(feedback);
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/oauth/google";
  };

  const handleConnectGithub = () => {
    window.location.href = "/api/auth/oauth/github";
  };

  const handleDisconnectGoogle = async () => {
    const feedback = await disconnectOAuth("google");
    pushToast(feedback);
  };

  const handleDisconnectGithub = async () => {
    const feedback = await disconnectOAuth("github");
    pushToast(feedback);
  };

  const [topbarDropdown, setTopbarDropdown] = useState(false);
  const topbarDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);

    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get("oauth_success");
    const oauthError = params.get("oauth_error");

    if (oauthSuccess || oauthError) {
      window.history.replaceState({}, "", window.location.pathname);

      if (oauthSuccess) {
        const isLogin = oauthSuccess.endsWith("_login");
        const provider = oauthSuccess.startsWith("google") ? "Google" : "GitHub";
        pushToast({
          ok: true,
          title: isLogin ? `Signed in with ${provider}` : `${provider} connected`,
          description: isLogin
            ? `Welcome! You are now signed in via ${provider}.`
            : `Your ${provider} account has been linked successfully.`,
          tone: "success",
        });
      } else if (oauthError) {
        pushToast({
          ok: false,
          title: "Connection failed",
          description: oauthError,
          tone: "error",
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!topbarDropdown) return;
    const handler = (e: MouseEvent) => {
      if (topbarDropdownRef.current && !topbarDropdownRef.current.contains(e.target as Node)) {
        setTopbarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [topbarDropdown]);

  return (
    <main className={styles.main} data-theme={theme}>
      <div className={styles.bgMesh} />
      <div className={styles.noise} />
      <div className={styles.lights}>
        <div className={cx(styles.light, styles.lightOne)} />
        <div className={cx(styles.light, styles.lightTwo)} />
        <div className={cx(styles.light, styles.lightThree)} />
      </div>

      {!isMounted ? null : (
        <>
          <ToastStack
            lifetimeMs={toastLifetimeMs}
            onDismiss={dismissToast}
            toasts={toasts}
          />

          <section className={styles.cabinetPage}>
            <div className={styles.cabinetPageTopbar}>
              <button
                type="button"
                className={styles.btnBack}
                onClick={() => router.push("/")}
              >
                <span className={styles.btnBackArrow}>←</span>
                Back Home
              </button>

              <div className={styles.cabinetPageActions}>
                {isAuthenticated ? (
                  <div className={styles.navProfileWrap} ref={topbarDropdownRef}>
                    <button
                      type="button"
                      className={cx(styles.topbarUser, topbarDropdown && styles.topbarUserOpen)}
                      onClick={() => setTopbarDropdown((v) => !v)}
                    >
                      {accountData.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={accountData.avatarUrl} alt="" className={styles.topbarAvatar} />
                      ) : (
                        <div className={styles.topbarAvatarPlaceholder}>
                          {(sessionUser?.name ?? sessionUser?.email ?? "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className={styles.topbarName}>{sessionUser?.name}</span>
                      <span className={styles.topbarChevron}>{topbarDropdown ? "▴" : "▾"}</span>
                    </button>

                    <div className={cx(styles.navDropdown, topbarDropdown && styles.navDropdownOpen)}>
                      <div className={styles.navDropdownHeader}>
                        {accountData.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={accountData.avatarUrl} alt="" className={styles.navDropdownAvatar} />
                        ) : (
                          <div className={styles.navDropdownAvatarPlaceholder}>
                            {(sessionUser?.name ?? sessionUser?.email ?? "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className={styles.navDropdownUserInfo}>
                          <span className={styles.navDropdownName}>{sessionUser?.name}</span>
                          <span className={styles.navDropdownEmail}>{sessionUser?.email}</span>
                        </div>
                      </div>

                      <div className={styles.navDropdownDivider} />

                      <button
                        type="button"
                        className={styles.navDropdownItem}
                        onClick={() => { setTopbarDropdown(false); router.push("/fitness"); }}
                      >
                        <span className={styles.navDropdownItemIcon}>🏋️</span>
                        Fitness Tracker
                      </button>

                      <button
                        type="button"
                        className={styles.navDropdownItem}
                        onClick={() => { setTopbarDropdown(false); router.push("/settings"); }}
                      >
                        <span className={styles.navDropdownItemIcon}>◈</span>
                        Settings
                      </button>

                      {isAdmin ? (
                        <button
                          type="button"
                          className={styles.navDropdownItem}
                          onClick={() => { setTopbarDropdown(false); router.push("/admin"); }}
                        >
                          <span className={styles.navDropdownItemIcon}>⬡</span>
                          Admin Panel
                        </button>
                      ) : null}

                      <div className={styles.navDropdownDivider} />

                      <button
                        type="button"
                        className={cx(styles.navDropdownItem, styles.navDropdownItemLogout)}
                        onClick={() => { setTopbarDropdown(false); void handleLogout(); }}
                      >
                        <span className={styles.navDropdownItemIcon}>→</span>
                        Sign out
                      </button>
                    </div>
                  </div>
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
                  email={sessionUser?.email ?? ""}
                  features={FEATURES}
                  profile={profile}
                  accountData={accountData}
                  suggestion={suggestion}
                  history={history}
                  roleOptions={CABINET_ROLE_OPTIONS}
                  areaOptions={IMPROVEMENT_AREAS}
                  onProfileFieldChange={setProfileField}
                  onSuggestionFieldChange={setSuggestionField}
                  onSubmitSuggestion={() => void handleSubmitSuggestion()}
                  onAvatarChange={handleAvatarChange}
                  onAvatarRemove={handleAvatarRemove}
                  onConnectGoogle={handleConnectGoogle}
                  onDisconnectGoogle={handleDisconnectGoogle}
                  onConnectGithub={handleConnectGithub}
                  onDisconnectGithub={handleDisconnectGithub}
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
        </>
      )}
    </main>
  );
}
