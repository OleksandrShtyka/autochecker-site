"use client";

import styles from "../styles";
import type { Feature, PreviewItem } from "../types";
import { cx } from "../utils";

type HeroSectionProps = {
  installCommand: string;
  marketplaceUrl: string;
  quickPills: string[];
  features: Feature[];
  previewStack: PreviewItem[];
  themeLabel: string;
  onDownloadVsix: () => void;
  onDownloadVSCode: () => void;
  onOpenFeature: (feature: Feature) => void;
};

export function HeroSection({
  installCommand,
  marketplaceUrl,
  quickPills,
  features,
  previewStack,
  themeLabel,
  onDownloadVsix,
  onDownloadVSCode,
  onOpenFeature,
}: HeroSectionProps) {
  return (
    <section className={styles.hero} id="top">
      <div className={styles.heroCopy}>
        <div className={cx(styles.fadeInUp, styles.heroBadge)}>
          <span className={styles.heroBadgeDot} />
          <span>Liquid workflow for a crowded dev stack</span>
        </div>

        <h1 className={cx(styles.heroTitle, styles.fadeInUp, styles.d1)}>
          One extension.
          <span className={styles.gradientText}> Two moods. Smooth like glass.</span>
        </h1>

        <p className={cx(styles.heroSubtitle, styles.fadeInUp, styles.d2)}>
          AutoChecker folds live server, HTTP requests, code quality, generators,
          formatter tools and Python helpers into one polished VS Code panel with
          a light and dark experience.
        </p>

        <div className={cx(styles.heroCtas, styles.fadeInUp, styles.d3)}>
          <button type="button" className={styles.btnPrimary} onClick={onDownloadVsix}>
            Download AutoChecker
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onDownloadVSCode}>
            Download VS Code for macOS
          </button>
          <a
            href={marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnSecondary}
          >
            Open Marketplace
          </a>
        </div>

        <div className={cx(styles.quickPills, styles.fadeInUp, styles.d4)}>
          {quickPills.map((pill) => (
            <span key={pill} className={styles.quickPill}>
              {pill}
            </span>
          ))}
        </div>

        <div className={cx(styles.featureDock, styles.fadeInUp, styles.d5)}>
          {features.slice(0, 4).map((feature) => (
            <button
              key={feature.title}
              type="button"
              className={styles.featureChip}
              onClick={() => onOpenFeature(feature)}
            >
              <span className={styles.featureChipIcon}>{feature.icon}</span>
              <span className={styles.featureChipText}>
                <strong>{feature.title}</strong>
                <small>tap for details</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={cx(styles.heroVisual, styles.fadeInUp, styles.d2)}>
        <div className={styles.visualHalo} />
        <div className={styles.previewShell}>
          <div className={styles.previewChrome}>
            <div className={styles.chromeDots}>
              <span className={cx(styles.dot, styles.dotRed)} />
              <span className={cx(styles.dot, styles.dotYellow)} />
              <span className={cx(styles.dot, styles.dotGreen)} />
            </div>
            <span className={styles.previewLabel}>AutoChecker glass dashboard</span>
            <span className={styles.previewLive}>live</span>
          </div>

          <div className={styles.previewBody}>
            <div className={styles.previewSidebar}>
              {previewStack.map((item, index) => (
                <div
                  key={item.label}
                  className={cx(
                    styles.sidebarCard,
                    (styles as Record<string, string>)[`d${index + 1}`]
                  )}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className={styles.previewMain}>
              <div className={styles.terminalWrap}>
                <div className={styles.terminalGlow} />
                <div className={styles.terminal}>
                  <div className={styles.terminalBar}>
                    <span>Quick install</span>
                    <span className={styles.terminalHint}>copy/paste</span>
                  </div>
                  <pre className={styles.terminalBody}>
                    <code className={styles.terminalPrompt}>$</code>{" "}
                    <code className={styles.terminalCmd}>{installCommand}</code>
                    <span className={styles.cursor} />
                  </pre>
                </div>
              </div>

              <div className={styles.signalGrid}>
                <div className={styles.signalCard}>
                  <span className={styles.signalLabel}>Activity</span>
                  <div className={styles.signalBars} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.downloadCard}
                  onClick={onDownloadVSCode}
                >
                  <span className={styles.downloadTitle}>Mac setup</span>
                  <strong>Download VS Code</strong>
                  <small>Universal DMG for Apple Silicon and Intel</small>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.floatingTokens} aria-hidden="true">
            <span className={styles.tokenOne}>{themeLabel}</span>
            <span className={styles.tokenTwo}>sidebar UI</span>
            <span className={styles.tokenThree}>61 commands</span>
          </div>
        </div>
      </div>
    </section>
  );
}
