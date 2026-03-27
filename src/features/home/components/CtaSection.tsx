import styles from "../styles";

type CtaSectionProps = {
  onDownloadVsix: () => void;
  onDownloadVSCode: () => void;
};

export function CtaSection({
  onDownloadVsix,
  onDownloadVSCode,
}: CtaSectionProps) {
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
            Download AutoChecker
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onDownloadVSCode}>
            Download VS Code macOS
          </button>
          <a
            href="/Files/app-release.apk"
            download="autochecker.apk"
            className={styles.btnSecondary}
          >
            📱 Download Android App
          </a>
        </div>
      </div>
    </section>
  );
}
