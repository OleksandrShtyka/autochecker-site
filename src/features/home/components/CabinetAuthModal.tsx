"use client";

import type { AuthForm, AuthMode } from "../types";
import styles from "../styles";
import { cx } from "../utils";

type CabinetAuthModalProps = {
  authForm: AuthForm;
  authMessage: string;
  authMode: AuthMode;
  isOpen: boolean;
  onAuthFieldChange: (field: keyof AuthForm, value: string) => void;
  onAuthModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  onGoogleLogin: () => void;
};

export function CabinetAuthModal({
  authForm,
  authMessage,
  authMode,
  isOpen,
  onAuthFieldChange,
  onAuthModeChange,
  onClose,
  onSubmit,
  onGoogleLogin,
}: CabinetAuthModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={cx(styles.modal, styles.authModal)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cabinet-auth-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalTop}>
          <div className={styles.modalBadge}>
            <span className={styles.modalIcon}>◌</span>
            <span>Cabinet access</span>
          </div>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close auth modal"
          >
            ✕
          </button>
        </div>

        <h3 id="cabinet-auth-title" className={styles.modalTitle}>
          {authMode === "register" ? "Create your cabinet account" : "Login to your cabinet"}
        </h3>
        <p className={styles.modalLead}>
          Після входу відкриється окрема сторінка кабінету з dashboard та пропозиціями.
        </p>

        <div className={styles.authTabs}>
          <button
            type="button"
            className={cx(styles.authTab, authMode === "register" && styles.authTabActive)}
            onClick={() => onAuthModeChange("register")}
          >
            Register
          </button>
          <button
            type="button"
            className={cx(styles.authTab, authMode === "login" && styles.authTabActive)}
            onClick={() => onAuthModeChange("login")}
          >
            Login
          </button>
        </div>

        <button type="button" className={styles.oauthGoogleBtn} onClick={onGoogleLogin}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div className={styles.oauthDivider}>
          <span>or</span>
        </div>

        <div className={cx(styles.formGrid, styles.authFormSurface)}>
          {authMode === "register" && (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Name</span>
              <input
                className={styles.fieldInput}
                value={authForm.name}
                onChange={(event) => onAuthFieldChange("name", event.target.value)}
                placeholder="Oleksandr"
              />
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <input
              className={styles.fieldInput}
              value={authForm.email}
              onChange={(event) => onAuthFieldChange("email", event.target.value)}
              placeholder="alex@example.com"
              type="email"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <input
              className={styles.fieldInput}
              value={authForm.password}
              onChange={(event) => onAuthFieldChange("password", event.target.value)}
              placeholder="At least something non-trivial"
              type="password"
            />
          </label>

          <div className={styles.fieldWide}>
            <button type="button" className={styles.btnPrimary} onClick={onSubmit}>
              {authMode === "register" ? "Create account" : "Sign in"}
            </button>
          </div>
        </div>

        {authMessage ? <p className={styles.authMessage}>{authMessage}</p> : null}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
