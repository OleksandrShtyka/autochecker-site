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
