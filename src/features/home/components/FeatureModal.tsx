"use client";

import styles from "../styles";
import type { Feature } from "../types";

type FeatureModalProps = {
  feature: Feature | null;
  title: string;
  onClose: () => void;
};

export function FeatureModal({ feature, title, onClose }: FeatureModalProps) {
  if (!feature) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalTop}>
          <div className={styles.modalBadge}>
            <span className={styles.modalIcon}>{feature.icon}</span>
            <span>{feature.count ?? "61"} tools in flow</span>
          </div>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close feature details"
          >
            ✕
          </button>
        </div>
        <h3 id="feature-modal-title" className={styles.modalTitle}>
          {title}
        </h3>
        <p className={styles.modalLead}>{feature.desc}</p>
        <div className={styles.modalBody}>
          {feature.bullets.map((bullet) => (
            <div key={bullet} className={styles.modalPoint}>
              <span className={styles.modalPointMark}>•</span>
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
