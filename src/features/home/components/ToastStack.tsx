"use client";

import styles from "../styles";
import type { ToastItem } from "../types";
import { cx } from "../utils";

type ToastStackProps = {
  lifetimeMs: number;
  onDismiss: (id: string) => void;
  toasts: ToastItem[];
};

export function ToastStack({ lifetimeMs, onDismiss, toasts }: ToastStackProps) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className={styles.toastViewport} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={cx(
            styles.toast,
            toast.tone === "success" && styles.toastSuccess,
            toast.tone === "error" && styles.toastError,
            toast.tone === "info" && styles.toastInfo
          )}
        >
          <div className={styles.toastTop}>
            <div className={styles.toastMeta}>
              <span className={styles.toastBadge}>
                {toast.tone === "success"
                  ? "Success"
                  : toast.tone === "error"
                    ? "Attention"
                    : "Info"}
              </span>
              <strong className={styles.toastTitle}>{toast.title}</strong>
              <p className={styles.toastText}>{toast.description}</p>
            </div>
            <button
              type="button"
              className={styles.toastClose}
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
          <div className={styles.toastTrack} aria-hidden="true">
            <span
              className={styles.toastProgress}
              style={{ animationDuration: `${lifetimeMs}ms` }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
