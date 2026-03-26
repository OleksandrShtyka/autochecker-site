"use client";

import styles from "../styles";
import type { DownloadState } from "../types";

type DownloadOverlayProps = {
  state: DownloadState;
};

export function DownloadOverlay({ state }: DownloadOverlayProps) {
  if (!state.visible) {
    return null;
  }

  return (
    <div className={styles.downloadOverlay} aria-live="polite">
      <div className={styles.downloadPanel}>
        <div className={styles.downloadPanelHead}>
          <span className={styles.downloadEyebrow}>Download in progress</span>
          <span className={styles.downloadPercent}>{Math.round(state.progress)}%</span>
        </div>
        <strong className={styles.downloadHeadline}>{state.label}</strong>
        <p className={styles.downloadText}>
          {state.done
            ? "Download request sent. Your file should start opening shortly."
            : "Preparing a smooth handoff and opening the download in a new tab."}
        </p>
        <div className={styles.downloadProgressTrack}>
          <span
            className={styles.downloadProgressFill}
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
