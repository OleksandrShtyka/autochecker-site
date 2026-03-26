"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { FEATURES } from "../data";
import { useCabinet } from "../hooks/useCabinet";
import { useTheme } from "../hooks/useTheme";
import { useToastQueue } from "../hooks/useToastQueue";
import styles from "../styles";
import { cx } from "../utils";
import { ToastStack } from "./ToastStack";
import { AccountSettings } from "./AccountSettings";

export function SettingsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { dismissToast, pushToast, toastLifetimeMs, toasts } = useToastQueue();
  const {
    accountData,
    isAdmin,
    isAuthenticated,
    isBooting,
    logout,
    profile,
    sessionUser,
    setProfileField,
    uploadAvatar,
    removeAvatar,
    disconnectOAuth,
  } = useCabinet({ features: FEATURES });

  // ── password form ──────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  // ── 2FA state ──────────────────────────────────────────────────────────────
  type TotpStep = "idle" | "setup" | "confirm" | "disable";
  const [totpStep, setTotpStep] = useState<TotpStep>("idle");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQr, setTotpQr] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);

  // sync from account data once loaded
  useEffect(() => {
    setTotpEnabled(accountData.totpEnabled);
  }, [accountData.totpEnabled]);

  // ── topbar dropdown ────────────────────────────────────────────────────────
  const [topbarDropdown, setTopbarDropdown] = useState(false);
  const topbarDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
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

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    const feedback = await logout();
    pushToast(feedback);
    router.push("/");
  };

  const handleAvatarChange = async (file: File) => {
    const feedback = await uploadAvatar(file);
    pushToast(feedback);
  };

  const handleAvatarRemove = async () => {
    const feedback = await removeAvatar();
    pushToast(feedback);
  };

  const handleDisconnectGoogle = async () => {
    const feedback = await disconnectOAuth("google");
    pushToast(feedback);
  };

  const handleDisconnectGithub = async () => {
    const feedback = await disconnectOAuth("github");
    pushToast(feedback);
  };

  const handleChangePassword = async () => {
    if (!pwForm.next || !pwForm.current) {
      pushToast({ ok: false, title: "Missing fields", description: "Fill in current and new password.", tone: "error" });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      pushToast({ ok: false, title: "Passwords don't match", description: "New password and confirmation must be identical.", tone: "error" });
      return;
    }
    if (pwForm.next.length < 8) {
      pushToast({ ok: false, title: "Too short", description: "New password must be at least 8 characters.", tone: "error" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const payload = await res.json() as { ok?: boolean; message?: string };
      if (!res.ok) {
        pushToast({ ok: false, title: "Password not changed", description: payload.message ?? "Something went wrong.", tone: "error" });
      } else {
        pushToast({ ok: true, title: "Password updated", description: "Your password has been changed successfully.", tone: "success" });
        setPwForm({ current: "", next: "", confirm: "" });
      }
    } catch {
      pushToast({ ok: false, title: "Network error", description: "Could not reach the server.", tone: "error" });
    } finally {
      setPwLoading(false);
    }
  };

  // ── 2FA handlers ───────────────────────────────────────────────────────────
  const handleTotpSetup = async () => {
    setTotpLoading(true);
    try {
      const res = await fetch("/api/auth/totp/setup", { method: "POST", credentials: "include" });
      const payload = await res.json() as { secret?: string; uri?: string; message?: string };
      if (!res.ok || !payload.secret || !payload.uri) {
        pushToast({ ok: false, title: "Setup failed", description: payload.message ?? "Could not generate 2FA secret.", tone: "error" });
        return;
      }
      setTotpSecret(payload.secret);
      const qrDataUrl = await QRCode.toDataURL(payload.uri, { width: 200, margin: 2 });
      setTotpQr(qrDataUrl);
      setTotpCode("");
      setTotpStep("setup");
    } catch {
      pushToast({ ok: false, title: "Network error", description: "Could not reach the server.", tone: "error" });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleTotpEnable = async () => {
    if (!/^\d{6}$/.test(totpCode)) {
      pushToast({ ok: false, title: "Invalid code", description: "Enter the 6-digit code from the app.", tone: "error" });
      return;
    }
    setTotpLoading(true);
    try {
      const res = await fetch("/api/auth/totp/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: totpCode }),
      });
      const payload = await res.json() as { ok?: boolean; message?: string };
      if (!res.ok) {
        pushToast({ ok: false, title: "Verification failed", description: payload.message ?? "Incorrect code.", tone: "error" });
      } else {
        setTotpEnabled(true);
        setTotpStep("idle");
        setTotpCode("");
        setTotpSecret("");
        setTotpQr("");
        pushToast({ ok: true, title: "2FA enabled", description: "Two-factor authentication is now active on your account.", tone: "success" });
      }
    } catch {
      pushToast({ ok: false, title: "Network error", description: "Could not reach the server.", tone: "error" });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleTotpDisable = async () => {
    if (!/^\d{6}$/.test(totpCode)) {
      pushToast({ ok: false, title: "Invalid code", description: "Enter the 6-digit code from the app to confirm.", tone: "error" });
      return;
    }
    setTotpLoading(true);
    try {
      const res = await fetch("/api/auth/totp/enable", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: totpCode }),
      });
      const payload = await res.json() as { ok?: boolean; message?: string };
      if (!res.ok) {
        pushToast({ ok: false, title: "Failed", description: payload.message ?? "Incorrect code.", tone: "error" });
      } else {
        setTotpEnabled(false);
        setTotpStep("idle");
        setTotpCode("");
        pushToast({ ok: true, title: "2FA disabled", description: "Two-factor authentication has been removed from your account.", tone: "info" });
      }
    } catch {
      pushToast({ ok: false, title: "Network error", description: "Could not reach the server.", tone: "error" });
    } finally {
      setTotpLoading(false);
    }
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

      {!isMounted ? null : (
        <>
          <ToastStack lifetimeMs={toastLifetimeMs} onDismiss={dismissToast} toasts={toasts} />

          <section className={styles.cabinetPage}>
            {/* Topbar */}
            <div className={styles.cabinetPageTopbar}>
              <button type="button" className={styles.btnBack} onClick={() => router.push("/cabinet")}>
                <span className={styles.btnBackArrow}>←</span>
                Dashboard
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

                      <button type="button" className={styles.navDropdownItem}
                        onClick={() => { setTopbarDropdown(false); router.push("/cabinet"); }}>
                        <span className={styles.navDropdownItemIcon}>⬡</span>
                        Dashboard
                      </button>

                      <button type="button" className={cx(styles.navDropdownItem, styles.navDropdownItemActive)}
                        onClick={() => setTopbarDropdown(false)}>
                        <span className={styles.navDropdownItemIcon}>◈</span>
                        Settings
                      </button>

                      {isAdmin ? (
                        <button type="button" className={styles.navDropdownItem}
                          onClick={() => { setTopbarDropdown(false); router.push("/admin"); }}>
                          <span className={styles.navDropdownItemIcon}>⬡</span>
                          Admin Panel
                        </button>
                      ) : null}

                      <div className={styles.navDropdownDivider} />

                      <button type="button"
                        className={cx(styles.navDropdownItem, styles.navDropdownItemLogout)}
                        onClick={() => { setTopbarDropdown(false); void handleLogout(); }}>
                        <span className={styles.navDropdownItemIcon}>→</span>
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Content */}
            {isBooting ? (
              <section className={styles.cabinetPageGate}>
                <div className={styles.cabinetPageGateCard}>
                  <span className={styles.sectionTag}>Loading</span>
                  <h1 className={styles.sectionTitle}>Checking your session...</h1>
                </div>
              </section>
            ) : !isAuthenticated ? (
              <section className={styles.cabinetPageGate}>
                <div className={styles.cabinetPageGateCard}>
                  <span className={styles.sectionTag}>Authorization required</span>
                  <h1 className={styles.sectionTitle}>Sign in to access settings.</h1>
                  <button type="button" className={styles.btnPrimary} onClick={() => router.push("/")}>
                    Go to main page
                  </button>
                </div>
              </section>
            ) : (
              <div className={styles.settingsLayout}>
                <div className={styles.settingsHeader}>
                  <span className={styles.sectionTag}>Settings</span>
                  <h1 className={styles.settingsTitle}>Account Settings</h1>
                  <p className={styles.settingsSubtitle}>
                    Manage your profile, security, and preferences.
                  </p>
                </div>

                {/* ── Account & Connections ── */}
                <div className={styles.settingsSection}>
                  <div className={styles.settingsSectionLabel}>
                    <span className={styles.settingsSectionIcon}>◎</span>
                    Account
                  </div>
                  <div className={styles.settingsSectionBody}>
                    <AccountSettings
                      email={sessionUser?.email ?? ""}
                      accountData={accountData}
                      onAvatarChange={handleAvatarChange}
                      onAvatarRemove={handleAvatarRemove}
                      onConnectGoogle={() => { window.location.href = "/api/auth/oauth/google"; }}
                      onDisconnectGoogle={handleDisconnectGoogle}
                      onConnectGithub={() => { window.location.href = "/api/auth/oauth/github"; }}
                      onDisconnectGithub={handleDisconnectGithub}
                    />
                  </div>
                </div>

                {/* ── Security ── */}
                <div className={styles.settingsSection}>
                  <div className={styles.settingsSectionLabel}>
                    <span className={styles.settingsSectionIcon}>⬡</span>
                    Security
                  </div>
                  <div className={styles.settingsSectionBody}>

                    {/* 2FA card */}
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHead}>
                        <div className={styles.settingsCardHeadText}>
                          <p className={styles.settingsCardTitle}>Two-Factor Authentication</p>
                          <p className={styles.settingsCardDesc}>
                            {totpEnabled
                              ? "Your account is protected with Google Authenticator."
                              : "Add an extra layer of security using Google Authenticator."}
                          </p>
                        </div>
                        <span className={cx(styles.settingsCardBadge, totpEnabled && styles.settingsCardBadgeGreen)}>
                          {totpEnabled ? "Active" : "Off"}
                        </span>
                      </div>

                      {/* Setup flow */}
                      {totpStep === "setup" && (
                        <div className={styles.totpSetupWrap}>
                          <div className={styles.totpQrWrap}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {totpQr && <img src={totpQr} alt="Scan this QR code with Google Authenticator" className={styles.totpQr} />}
                          </div>
                          <div className={styles.totpSetupInfo}>
                            <p className={styles.totpSetupStep}>
                              <strong>Step 1.</strong> Open <strong>Google Authenticator</strong> on your phone and tap the <strong>+</strong> button → "Scan a QR code".
                            </p>
                            <p className={styles.totpSetupStep}>
                              <strong>Step 2.</strong> Scan the QR code on the left, or enter the key manually:
                            </p>
                            <div className={styles.totpSecretWrap}>
                              <code className={styles.totpSecret}>{totpSecret.match(/.{1,4}/g)?.join(" ")}</code>
                              <button
                                type="button"
                                className={styles.totpCopyBtn}
                                onClick={() => { void navigator.clipboard.writeText(totpSecret); pushToast({ ok: true, title: "Copied", description: "Secret copied to clipboard.", tone: "info" }); }}
                              >
                                Copy
                              </button>
                            </div>
                            <p className={styles.totpSetupStep}>
                              <strong>Step 3.</strong> Enter the 6-digit code from the app to confirm setup:
                            </p>
                            <div className={styles.totpConfirmRow}>
                              <input
                                className={styles.mfaCodeInput}
                                type="text"
                                inputMode="numeric"
                                pattern="\d{6}"
                                maxLength={6}
                                placeholder="000000"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                autoComplete="one-time-code"
                              />
                              <button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={() => void handleTotpEnable()}
                                disabled={totpLoading || totpCode.length !== 6}
                              >
                                {totpLoading ? "Verifying…" : "Activate 2FA"}
                              </button>
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => { setTotpStep("idle"); setTotpCode(""); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Disable confirmation */}
                      {totpStep === "disable" && (
                        <div className={styles.totpDisableWrap}>
                          <p className={styles.settingsCardDesc}>
                            Enter the current code from Google Authenticator to confirm disabling 2FA.
                          </p>
                          <div className={styles.totpConfirmRow}>
                            <input
                              className={styles.mfaCodeInput}
                              type="text"
                              inputMode="numeric"
                              pattern="\d{6}"
                              maxLength={6}
                              placeholder="000000"
                              value={totpCode}
                              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              autoComplete="one-time-code"
                              autoFocus
                            />
                            <button
                              type="button"
                              className={styles.btnDanger}
                              onClick={() => void handleTotpDisable()}
                              disabled={totpLoading || totpCode.length !== 6}
                            >
                              {totpLoading ? "Disabling…" : "Disable 2FA"}
                            </button>
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              onClick={() => { setTotpStep("idle"); setTotpCode(""); }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {totpStep === "idle" && (
                        <div className={styles.settingsCardActions}>
                          {totpEnabled ? (
                            <button
                              type="button"
                              className={styles.btnDanger}
                              onClick={() => { setTotpCode(""); setTotpStep("disable"); }}
                            >
                              Disable 2FA
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.btnPrimary}
                              onClick={() => void handleTotpSetup()}
                              disabled={totpLoading}
                            >
                              {totpLoading ? "Generating…" : "Enable 2FA"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Change password */}
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHead}>
                        <div className={styles.settingsCardHeadText}>
                          <p className={styles.settingsCardTitle}>Change Password</p>
                          <p className={styles.settingsCardDesc}>
                            Use a strong password with at least 8 characters.
                          </p>
                        </div>
                        <span className={styles.settingsCardBadge}>Password</span>
                      </div>
                      <div className={styles.settingsCardFields}>
                        <label className={styles.field}>
                          <span className={styles.fieldLabel}>Current password</span>
                          <input
                            type="password"
                            className={styles.fieldInput}
                            value={pwForm.current}
                            onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                            placeholder="••••••••"
                            autoComplete="current-password"
                          />
                        </label>
                        <label className={styles.field}>
                          <span className={styles.fieldLabel}>New password</span>
                          <input
                            type="password"
                            className={styles.fieldInput}
                            value={pwForm.next}
                            onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                            placeholder="Min. 8 characters"
                            autoComplete="new-password"
                          />
                        </label>
                        <label className={styles.field}>
                          <span className={styles.fieldLabel}>Confirm new password</span>
                          <input
                            type="password"
                            className={styles.fieldInput}
                            value={pwForm.confirm}
                            onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                            placeholder="Repeat new password"
                            autoComplete="new-password"
                          />
                        </label>
                      </div>
                      <div className={styles.settingsCardActions}>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          onClick={() => void handleChangePassword()}
                          disabled={pwLoading}
                        >
                          {pwLoading ? "Saving…" : "Update password"}
                        </button>
                      </div>
                    </div>

                    {/* Session */}
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHead}>
                        <div className={styles.settingsCardHeadText}>
                          <p className={styles.settingsCardTitle}>Active Session</p>
                          <p className={styles.settingsCardDesc}>
                            You are currently signed in as <strong>{sessionUser?.email}</strong>.
                            Sessions expire after 7 days.
                          </p>
                        </div>
                        <span className={cx(styles.settingsCardBadge, styles.settingsCardBadgeGreen)}>Active</span>
                      </div>
                      <div className={styles.settingsCardActions}>
                        <button type="button" className={styles.btnSecondary} onClick={() => void handleLogout()}>
                          Sign out this device
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Preferences ── */}
                <div className={styles.settingsSection}>
                  <div className={styles.settingsSectionLabel}>
                    <span className={styles.settingsSectionIcon}>◌</span>
                    Preferences
                  </div>
                  <div className={styles.settingsSectionBody}>
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHead}>
                        <div className={styles.settingsCardHeadText}>
                          <p className={styles.settingsCardTitle}>Appearance</p>
                          <p className={styles.settingsCardDesc}>
                            Switch between light and dark theme. Your preference is saved locally.
                          </p>
                        </div>
                        <span className={styles.settingsCardBadge}>{theme === "dark" ? "Dark" : "Light"}</span>
                      </div>
                      <div className={styles.settingsThemeRow}>
                        <button
                          type="button"
                          className={cx(styles.settingsThemeBtn, theme === "light" && styles.settingsThemeBtnActive)}
                          onClick={() => theme === "dark" && toggleTheme()}
                        >
                          <span className={styles.settingsThemeBtnIcon}>☀</span>
                          Light
                        </button>
                        <button
                          type="button"
                          className={cx(styles.settingsThemeBtn, theme === "dark" && styles.settingsThemeBtnActive)}
                          onClick={() => theme === "light" && toggleTheme()}
                        >
                          <span className={styles.settingsThemeBtnIcon}>◑</span>
                          Dark
                        </button>
                      </div>
                    </div>

                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHead}>
                        <div className={styles.settingsCardHeadText}>
                          <p className={styles.settingsCardTitle}>Display Name</p>
                          <p className={styles.settingsCardDesc}>
                            This name appears in your profile and cabinet dashboard.
                          </p>
                        </div>
                      </div>
                      <div className={styles.settingsCardFields}>
                        <label className={styles.field}>
                          <span className={styles.fieldLabel}>Name</span>
                          <input
                            className={styles.fieldInput}
                            value={profile.name}
                            onChange={(e) => setProfileField("name", e.target.value)}
                            placeholder="Your name"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Danger Zone ── */}
                <div className={styles.settingsSection}>
                  <div className={styles.settingsSectionLabel}>
                    <span className={styles.settingsSectionIcon}>⚠</span>
                    Danger Zone
                  </div>
                  <div className={styles.settingsSectionBody}>
                    <div className={cx(styles.settingsCard, styles.settingsCardDanger)}>
                      <div className={styles.settingsCardHead}>
                        <div className={styles.settingsCardHeadText}>
                          <p className={styles.settingsCardTitle}>Delete Account</p>
                          <p className={styles.settingsCardDesc}>
                            Permanently remove your account and all associated data.
                            This action cannot be undone.
                          </p>
                        </div>
                        <span className={cx(styles.settingsCardBadge, styles.settingsCardBadgeDanger)}>Irreversible</span>
                      </div>
                      <div className={styles.settingsCardActions}>
                        <button type="button" className={styles.btnDanger} disabled title="Contact support to delete your account">
                          Delete my account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
