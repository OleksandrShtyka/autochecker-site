"use client";

import styles from "../styles";
import { useLang } from "../context/LangContext";

type CtaSectionProps = {
  onDownloadVsix: () => void;
  onDownloadVSCode: () => void;
};

export function CtaSection({
  onDownloadVsix,
  onDownloadVSCode,
}: CtaSectionProps) {
  const { t } = useLang();
  return (
    <section className={styles.cta}>
      <div className={styles.ctaInner}>
        <div className={styles.ctaCopyPanel}>
          <span className={styles.sectionTag}>Ready to install</span>
          <h2 className={styles.ctaTitle}>
            Stop stacking tiny tools.
            <span className={styles.gradientText}> Use one polished cockpit.</span>
          </h2>
          <p className={styles.ctaSubtitle}>
            AutoChecker replaces a mess of separate extensions with one compact,
            rounded workspace utility layer, and now also helps macOS users grab VS Code quickly.
          </p>
        </div>
        <div className={styles.ctaActions}>
          <button type="button" className={styles.btnPrimary} onClick={onDownloadVsix}>
            {t("cta_btn")}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onDownloadVSCode}>
            Download VS Code macOS
          </button>
          <a
            href="/Files/app-release.apk"
            download="autochecker.apk"
            className={styles.btnSecondary}
          >
            {t("cta_mobile")}
          </a>
        </div>
      </div>
    </section>
  );
}
