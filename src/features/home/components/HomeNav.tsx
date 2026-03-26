"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { AccountData, NavItem } from "../types";
import styles from "../styles";
import { cx } from "../utils";

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
  onLogout,
  onInstall,
  githubUrl,
  version,
}: HomeNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
                {item.label}
              </button>
            ))}
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={styles.navLink}>
              GitHub
            </a>
          </div>

          {isAuthenticated ? (
            <div className={styles.navProfileWrap} ref={wrapRef}>
              <button
                type="button"
                className={cx(styles.navProfileBtn, dropdownOpen && styles.navProfileBtnOpen)}
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="Profile menu"
              >
                {accountData.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={accountData.avatarUrl} alt="" className={styles.navProfileAvatar} />
                ) : (
                  <span className={styles.navProfileInitials}>{initials}</span>
                )}
              </button>

              <div className={cx(styles.navDropdown, dropdownOpen && styles.navDropdownOpen)}>
                <div className={styles.navDropdownHeader}>
                  {accountData.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={accountData.avatarUrl} alt="" className={styles.navDropdownAvatar} />
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
                  Dashboard
                </button>

                <button
                  type="button"
                  className={styles.navDropdownItem}
                  onClick={() => { setDropdownOpen(false); onOpenDashboard(); }}
                >
                  <span className={styles.navDropdownItemIcon}>◈</span>
                  Settings
                </button>

                {isAdmin ? (
                  <button
                    type="button"
                    className={styles.navDropdownItem}
                    onClick={() => { setDropdownOpen(false); onOpenDashboard(); }}
                  >
                    <span className={styles.navDropdownItemIcon}>⬡</span>
                    Admin Panel
                  </button>
                ) : null}

                <div className={styles.navDropdownDivider} />

                <button
                  type="button"
                  className={cx(styles.navDropdownItem, styles.navDropdownItemLogout)}
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                >
                  <span className={styles.navDropdownItemIcon}>→</span>
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles.navGhost} onClick={onOpenCabinet}>
              Sign In
            </button>
          )}

          <button type="button" className={styles.navCta} onClick={onInstall}>
            Install
          </button>
        </div>
      </div>
    </nav>
  );
}
