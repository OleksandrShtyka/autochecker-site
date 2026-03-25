import styles from "./page.module.css";

const FEATURES = [
  { icon: "📦", title: "Project Setup",      desc: "Init configs, scaffold directories, generate .env — one command to rule them all.",                                        count: 3  },
  { icon: "🖥️", title: "Live Server",        desc: "Static HTTP server on :5500 with WebSocket live reload. No npm install needed.",                                          count: 2  },
  { icon: "📋", title: "Console Logs",       desc: "Turbo Console Log — insert, comment, uncomment, delete all logs with keyboard shortcuts.",                                count: 9  },
  { icon: "🛠️", title: "Code Quality",       desc: "Sort imports, remove unused, scan TODOs, find dead code and duplicates across your project.",                             count: 5  },
  { icon: "⚡",  title: "Code Generation",   desc: "Generate hooks, API routes, TS interfaces from JSON, barrel exports, React components.",                                  count: 5  },
  { icon: "🌐", title: "HTTP Client",        desc: "Postman-style panel inside VS Code — 7 methods, headers, body, auth, persistent history.",                               count: 1  },
  { icon: "🎨", title: "Frontend Tools",     desc: "Tailwind class sorter, CSS-to-Tailwind converter, breakpoints, fonts, color picker, unit converter.",                    count: 6  },
  { icon: "🔧", title: "Formatters",         desc: "JSON format/minify, JWT decoder, string case converter (7 formats), password generator.",                                count: 4  },
  { icon: "🚀", title: "DX & Productivity",  desc: "Try/catch wrap, comment headers, bookmarks, snippets, kill port, file scaffolder.",                                      count: 8  },
  { icon: "🐍", title: "Python Tools",       desc: "Insert print, try/except wrap, class/function/route generators, venv, requirements.txt, run file.",                     count: 11 },
  { icon: "📦", title: "Project",            desc: "README generator, package.json script editor, outdated checker, project tree to clipboard.",                             count: 5  },
  { icon: "📌", title: "Sidebar Dashboard",  desc: "Accordion UI in Activity Bar — all 61 commands organized in searchable groups.",                                         count: null },
];

const STATS = [
  { value: "61",    label: "Commands"        },
  { value: "0",     label: "Dependencies"    },
  { value: "56 KB", label: "Package Size"    },
  { value: "12",    label: "Feature Groups"  },
  { value: "7",     label: "Keybindings"     },
  { value: "11",    label: "Versions Shipped"},
];

const SECURITY = [
  ["Path traversal protection",  "Live Server validates resolved paths against workspace root with sep boundary check."        ],
  ["Shell injection prevention", "All terminal commands escape arguments. PID validation before kill. No eval()."             ],
  ["XSS mitigation",             "404 pages don't reflect raw URLs. Response output is escaped."                              ],
  ["Crypto-safe randomness",     "Password generator uses rejection sampling — no modulo bias."                               ],
  ["Token redaction",            "Bearer tokens are masked in persisted history files."                                       ],
  ["Bounded I/O",                "HTTP client enforces 10 MB response limit. History files are size-guarded."                 ],
] as const;

const VSIX_FILE    = "https://github.com/OleksandrShtyka/auto-check-standard/releases/download/0.0.11/autochecker-0.0.11.vsix";
const VSIX_NAME    = "autochecker-0.0.11.vsix";
const INSTALL_CMD  = `code --install-extension ${VSIX_NAME}`;
const MARKETPLACE  = "https://marketplace.visualstudio.com/items?itemName=shtyka-dev.autochecker";
const GITHUB       = "https://github.com/OleksandrShtyka/auto-check-standard";

/* helper to merge module class names */
const cx = (...names: (string | undefined | false)[]) => names.filter(Boolean).join(" ");

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.bgGrid} />
      <div className={styles.orbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <span className={styles.navLogoIcon}>⚡</span>
            <span className={styles.navLogoText}>AutoChecker</span>
            <span className={styles.navBadge}>v0.0.11</span>
          </div>
          <div className={styles.navLinks}>
            <a href={GITHUB}      target="_blank" rel="noopener noreferrer" className={styles.navLink}>GitHub</a>
            <a href={MARKETPLACE} target="_blank" rel="noopener noreferrer" className={styles.navCta}>Install Extension</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={cx(styles.fadeInUp)}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            <span className={styles.heroBadgeText}>
              61 commands &middot; Zero dependencies &middot; One sidebar
            </span>
          </div>
        </div>

        <h1 className={cx(styles.heroTitle, styles.fadeInUp, styles.d1)}>
          The only VS Code extension{" "}
          <span className={styles.gradientText}>you need</span>
        </h1>

        <p className={cx(styles.heroSubtitle, styles.fadeInUp, styles.d2)}>
          Live server, HTTP client, console logger, code quality, generators,
          formatters, Python tools — all in one extension with a beautiful
          sidebar dashboard.
        </p>

        <div className={cx(styles.heroCtas, styles.fadeInUp, styles.d3)}>
          <a href={MARKETPLACE} target="_blank" rel="noopener noreferrer" className={styles.btnPrimary}>
            Install from Marketplace
          </a>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>
            View on GitHub
          </a>
        </div>

        <div className={cx(styles.terminalWrap, styles.fadeInUp, styles.d4)}>
          <div className={styles.terminalGlow} />
          <div className={styles.terminal}>
            <div className={styles.terminalBar}>
              <span className={cx(styles.dot, styles.dotRed)}    />
              <span className={cx(styles.dot, styles.dotYellow)} />
              <span className={cx(styles.dot, styles.dotGreen)}  />
              <span className={styles.terminalLabel}>zsh — terminal</span>
            </div>
            <pre className={styles.terminalBody}>
              <code className={styles.terminalPrompt}>$</code>{" "}
              <code className={styles.terminalCmd}>{INSTALL_CMD}</code>
              <span className={styles.cursor} />
            </pre>
          </div>

          <div className={styles.downloadRow}>
            <span className={styles.downloadDivider}>or download directly</span>
            <a
              href={VSIX_FILE}
              download={VSIX_NAME}
              className={styles.downloadBtn}
            >
              <span className={styles.downloadIcon}>↓</span>
              Download .vsix
              <span className={styles.downloadMeta}>56 KB</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          {STATS.map((s, i) => (
            <div key={s.label} className={cx(styles.statItem, styles.scaleIn, (styles as Record<string,string>)[`d${i + 1}`])}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.features} id="features">
        <div className={styles.sectionHeader}>
          <div className={cx(styles.fadeInUp)}>
            <span className={styles.sectionTag}>Features</span>
          </div>
          <h2 className={cx(styles.sectionTitle, styles.fadeInUp, styles.d1)}>
            Everything you need.{" "}
            <span className={styles.sectionMuted}>Nothing you don&apos;t.</span>
          </h2>
          <p className={cx(styles.sectionSubtitle, styles.fadeInUp, styles.d2)}>
            12 feature groups, 61 commands — from project scaffolding to Python
            development, all accessible from one sidebar.
          </p>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className={cx(styles.card, styles.scaleIn, (styles as Record<string,string>)[`d${i + 1}`])}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconBox}>{f.icon}</div>
                {f.count !== null && (
                  <span className={styles.cardBadge}>{f.count} cmd{f.count !== 1 ? "s" : ""}</span>
                )}
              </div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section className={styles.security}>
        <div className={styles.securityInner}>
          <div className={styles.sectionHeader}>
            <div className={cx(styles.fadeInUp)}>
              <span className={styles.sectionTag}>Security</span>
            </div>
            <h2 className={cx(styles.sectionTitle, styles.fadeInUp, styles.d1)}>
              Security-first.{" "}
              <span className={styles.sectionMuted}>Not an afterthought.</span>
            </h2>
          </div>
          <div className={styles.securityGrid}>
            {SECURITY.map(([title, desc], i) => (
              <div key={title} className={cx(styles.securityCard, styles.fadeInUp, (styles as Record<string,string>)[`d${i + 1}`])}>
                <div className={styles.securityCardHeader}>
                  <span className={styles.checkmark}>✓</span>
                  <span className={styles.securityCardTitle}>{title}</span>
                </div>
                <p className={styles.securityCardDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className={styles.ctaBg} />
        <div className={styles.ctaInner}>
          <h2 className={cx(styles.ctaTitle, styles.fadeInUp)}>
            Stop installing{" "}
            <span className={styles.gradientText}>15 extensions</span>
          </h2>
          <p className={cx(styles.ctaSubtitle, styles.fadeInUp, styles.d1)}>
            AutoChecker replaces Live Server, Turbo Console Log, REST Client,
            Tailwind Sorter, and more — in a single 56 KB package.
          </p>
          <div className={cx(styles.fadeInUp, styles.d2)}>
            <a href={MARKETPLACE} target="_blank" rel="noopener noreferrer" className={styles.btnLarge}>
              Install AutoChecker — It&apos;s Free
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerBrandIcon}>⚡</span>
            <span>Built by Oleksandr Shtyka</span>
          </div>
          <div className={styles.footerLinks}>
            <a href={GITHUB}      target="_blank" rel="noopener noreferrer" className={styles.footerLink}>GitHub</a>
            <a href={MARKETPLACE} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Marketplace</a>
            <span className={styles.footerText}>MIT License</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
