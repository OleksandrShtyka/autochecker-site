"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { AccountData, NavItem } from "../types";
import styles from "../styles";
import { cx } from "../utils";
import { useLang } from "../context/LangContext";

type HomeNavProps = {
  activeSection: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  accountData: AccountData;
  userName: string;
  userEmail: string;
  navItems: NavItem[];
  navIndicator: {
    left: number;
    width: number;
    opacity: number;
  };
  navRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  navTrackRef: MutableRefObject<HTMLDivElement | null>;
  onScrollToSection: (id: string) => void;
  onOpenCabinet: () => void;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onInstall: () => void;
  githubUrl: string;
  version: string;
};

export function HomeNav({
  activeSection,
  isAuthenticated,
  isAdmin,
  accountData,
  userName,
  userEmail,
  navItems,
  navIndicator,
  navRefs,
  navTrackRef,
  onScrollToSection,
  onOpenCabinet,
  onOpenDashboard,
  onOpenSettings,
  onOpenAdmin,
  onLogout,
  onInstall,
  githubUrl,
  version,
}: HomeNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    setAvatarError(false);
  }, [accountData.avatarUrl]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const displayName = userName || userEmail;
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <button type="button" className={styles.navLogo} onClick={() => onScrollToSection("top")}>
          <span className={styles.navLogoIcon}>◌</span>
          <span className={styles.navLogoText}>AutoChecker</span>
          <span className={styles.navBadge}>v{version}</span>
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
                ref={(node) => { navRefs.current[item.id] = node; }}
                className={cx(styles.navLink, activeSection === item.id && styles.navLinkActive)}
                onClick={() => onScrollToSection(item.id)}
              >
                {t(`nav_${item.id}`) || item.label}
              </button>
            ))}
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={styles.navLink}>
              GitHub
            </a>
          </div>

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "uk" : "en")}
            title={lang === "en" ? "Switch to Ukrainian" : "Переключити на English"}
            style={{
              background: "none",
              border: "1px solid rgba(14,159,152,0.35)",
              borderRadius: "6px",
              color: "var(--text-muted, #64748b)",
              cursor: "pointer",
              fontSize: "13px",
              padding: "3px 8px",
              lineHeight: 1.4,
              fontFamily: "inherit",
            }}
          >
            {lang === "en" ? "🇺🇦 UA" : "🇬🇧 EN"}
          </button>

          {isAuthenticated ? (
            <div className={styles.navProfileWrap} ref={wrapRef}>
              <button
                type="button"
                className={cx(styles.navProfileBtn, dropdownOpen && styles.navProfileBtnOpen)}
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="Profile menu"
              >
                {accountData.avatarUrl && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={accountData.avatarUrl} alt="" className={styles.navProfileAvatar} onError={() => setAvatarError(true)} />
                ) : (
                  <span className={styles.navProfileInitials}>{initials}</span>
                )}
              </button>

              <div className={cx(styles.navDropdown, dropdownOpen && styles.navDropdownOpen)}>
                <div className={styles.navDropdownHeader}>
                  {accountData.avatarUrl && !avatarError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={accountData.avatarUrl} alt="" className={styles.navDropdownAvatar} onError={() => setAvatarError(true)} />
                  ) : (
                    <div className={styles.navDropdownAvatarPlaceholder}>{initials}</div>
                  )}
                  <div className={styles.navDropdownUserInfo}>
                    <span className={styles.navDropdownName}>{displayName}</span>
                    <span className={styles.navDropdownEmail}>{userEmail}</span>
                  </div>
                </div>

                <div className={styles.navDropdownDivider} />

                <button
                  type="button"
                  className={styles.navDropdownItem}
                  onClick={() => { setDropdownOpen(false); onOpenDashboard(); }}
                >
                  <span className={styles.navDropdownItemIcon}>⬡</span>
                  {t("nav_dashboard")}
                </button>

                <button
                  type="button"
                  className={styles.navDropdownItem}
                  onClick={() => { setDropdownOpen(false); onOpenSettings(); }}
                >
                  <span className={styles.navDropdownItemIcon}>◈</span>
                  {t("nav_settings")}
                </button>

                {isAdmin ? (
                  <button
                    type="button"
                    className={styles.navDropdownItem}
                    onClick={() => { setDropdownOpen(false); onOpenAdmin(); }}
                  >
                    <span className={styles.navDropdownItemIcon}>⬡</span>
                    {t("nav_admin")}
                  </button>
                ) : null}

                <div className={styles.navDropdownDivider} />

                <button
                  type="button"
                  className={cx(styles.navDropdownItem, styles.navDropdownItemLogout)}
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                >
                  <span className={styles.navDropdownItemIcon}>→</span>
                  {t("nav_signout")}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles.navGhost} onClick={onOpenCabinet}>
              {t("nav_signin")}
            </button>
          )}

          <button type="button" className={styles.navCta} onClick={onInstall}>
            {t("nav_install")}
          </button>
        </div>
      </div>
    </nav>
  );
}
