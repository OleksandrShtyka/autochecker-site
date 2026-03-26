"use client";

import type { MutableRefObject } from "react";
import type { NavItem, Theme } from "../types";
import styles from "../styles";
import { cx } from "../utils";

type HomeNavProps = {
  activeSection: string;
  isAuthenticated: boolean;
  theme: Theme;
  navItems: NavItem[];
  navIndicator: {
    left: number;
    width: number;
    opacity: number;
  };
  navRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  navTrackRef: MutableRefObject<HTMLDivElement | null>;
  onScrollToSection: (id: string) => void;
  onToggleTheme: () => void;
  onOpenCabinet: () => void;
  onInstall: () => void;
  githubUrl: string;
};

export function HomeNav({
  activeSection,
  isAuthenticated,
  theme,
  navItems,
  navIndicator,
  navRefs,
  navTrackRef,
  onScrollToSection,
  onToggleTheme,
  onOpenCabinet,
  onInstall,
  githubUrl,
}: HomeNavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <button type="button" className={styles.navLogo} onClick={() => onScrollToSection("top")}>
          <span className={styles.navLogoIcon}>◌</span>
          <span className={styles.navLogoText}>AutoChecker</span>
          <span className={styles.navBadge}>v0.0.11</span>
        </button>

        <div className={styles.navLinksWrap}>
          <div className={styles.navLinks} ref={navTrackRef}>
            <span
              className={styles.navIndicator}
              style={{
                transform: `translateX(${navIndicator.left}px)`,
                width: `${navIndicator.width}px`,
                opacity: navIndicator.opacity,
              }}
            />
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                ref={(node) => {
                  navRefs.current[item.id] = node;
                }}
                className={cx(styles.navLink, activeSection === item.id && styles.navLinkActive)}
                onClick={() => onScrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={styles.navLink}>
              GitHub
            </a>
          </div>

          <button
            type="button"
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            <span className={styles.themeToggleTrack}>
              <span
                className={cx(
                  styles.themeToggleThumb,
                  theme === "dark" && styles.themeToggleThumbDark
                )}
              />
            </span>
            <span className={styles.themeToggleLabel}>
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>

          <button type="button" className={styles.navGhost} onClick={onOpenCabinet}>
            {isAuthenticated ? "Open Cabinet" : "Cabinet Login"}
          </button>

          <button type="button" className={styles.navCta} onClick={onInstall}>
            Install
          </button>
        </div>
      </div>
    </nav>
  );
}
