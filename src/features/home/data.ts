import type { Feature, NavItem, PreviewItem, SecurityItem, Stat } from "./types";

export const FEATURES: Feature[] = [
  {
    icon: "📦",
    title: "Project Setup",
    desc: "Init configs, scaffold directories, generate .env and spin up a clean workspace in one move.",
    count: 3,
    bullets: [
      "Creates a predictable project skeleton so a new repo starts cleanly instead of chaotically.",
      "Speeds up repetitive bootstrapping for personal tools, prototypes and internal team apps.",
      "Helps keep config drift low when you create multiple projects over time.",
    ],
  },
  {
    icon: "🖥️",
    title: "Live Server",
    desc: "Static HTTP server on :5500 with live reload and quick feedback right inside your workflow.",
    count: 2,
    bullets: [
      "Launches a quick local preview without pulling in an extra web stack just to inspect HTML/CSS changes.",
      "Keeps the feedback loop tight with live reload while you iterate on layouts and micro fixes.",
      "Useful for static pages, test snippets and fast front-end verification during extension work.",
    ],
  },
  {
    icon: "📋",
    title: "Console Logs",
    desc: "Insert, comment, uncomment and clean logs with shortcut-first actions when debugging gets noisy.",
    count: 9,
    bullets: [
      "Makes temporary debugging much faster than writing and deleting logs by hand.",
      "Lets you silence or restore logging in batches when you want to compare behavior safely.",
      "Great for keeping messy debug sessions from leaking into final commits.",
    ],
  },
  {
    icon: "🛠️",
    title: "Code Quality",
    desc: "Sort imports, remove unused code, scan TODOs and surface duplicates before they pile up.",
    count: 5,
    bullets: [
      "Helps tame entropy in a growing codebase before small issues become maintenance debt.",
      "Surfaces dead code and duplicate fragments that quietly slow teams down.",
      "Useful as a quick pre-commit cleanup pass without leaving the editor.",
    ],
  },
  {
    icon: "⚡",
    title: "Code Generation",
    desc: "Generate hooks, routes, TS interfaces, barrel exports and React components faster.",
    count: 5,
    bullets: [
      "Removes repetitive boilerplate when new features need the same scaffolding patterns every time.",
      "Keeps generated files consistent so teammates read familiar structures.",
      "Helpful when moving quickly on APIs, hooks and shared type surfaces.",
    ],
  },
  {
    icon: "🌐",
    title: "HTTP Client",
    desc: "A Postman-style request panel with methods, auth, headers, body and saved request history.",
    count: 1,
    bullets: [
      "Lets you inspect APIs without context-switching to another app.",
      "Saved history makes repeated debugging and regression checks much more comfortable.",
      "Especially handy for local backend work where quick request replay matters.",
    ],
  },
  {
    icon: "🎨",
    title: "Frontend Tools",
    desc: "Tailwind sorting, CSS conversion, breakpoints, fonts, color tools and unit helpers in one place.",
    count: 6,
    bullets: [
      "Bundles many tiny front-end utilities that usually end up spread across separate extensions and websites.",
      "Improves flow during UI work where spacing, colors, classes and breakpoints all change together.",
      "Good for reducing tab-hopping during design implementation.",
    ],
  },
  {
    icon: "🔧",
    title: "Formatters",
    desc: "JSON, JWT, string-case conversion and password tools for the small repetitive tasks.",
    count: 4,
    bullets: [
      "Covers annoying utility work that interrupts momentum more often than people admit.",
      "Gives quick transformations directly where you already work.",
      "Useful for auth debugging, data cleanup and one-off formatting chores.",
    ],
  },
  {
    icon: "🚀",
    title: "DX & Productivity",
    desc: "Bookmarks, snippets, scaffolding, comment headers, kill-port helpers and more.",
    count: 8,
    bullets: [
      "Speeds up the small habits that compound across long coding sessions.",
      "Reduces friction when you repeatedly bounce between tasks and local environments.",
      "Great for turning awkward manual rituals into one-click actions.",
    ],
  },
  {
    icon: "🐍",
    title: "Python Tools",
    desc: "Route, class and function generators, venv helpers and quick run utilities for Python flows.",
    count: 11,
    bullets: [
      "Makes Python setup and repetitive code generation feel first-class inside the same toolbox.",
      "Useful when you switch between JS/TS and Python in the same week.",
      "Cuts down the setup friction around files, functions and local execution.",
    ],
  },
  {
    icon: "📦",
    title: "Project",
    desc: "README generation, package.json script editing, outdated checks and project tree export.",
    count: 5,
    bullets: [
      "Keeps common repo maintenance tasks close at hand instead of buried in custom scripts.",
      "Helpful for documenting, auditing and sharing project structure quickly.",
      "Supports the boring but important upkeep side of development.",
    ],
  },
  {
    icon: "📌",
    title: "Sidebar Dashboard",
    desc: "A searchable accordion dashboard in the Activity Bar that keeps 61 commands organized.",
    count: null,
    bullets: [
      "Turns a large feature set into something approachable instead of overwhelming.",
      "Search and grouping help users find tools quickly when they do not remember exact command names.",
      "Acts like the visual control center for the whole extension.",
    ],
  },
];

export const STATS: Stat[] = [
  { value: "61", label: "Commands" },
  { value: "0", label: "Dependencies" },
  { value: "56 KB", label: "Package Size" },
  { value: "12", label: "Feature Groups" },
  { value: "7", label: "Keybindings" },
  { value: "11", label: "Versions Shipped" },
];

export const SECURITY: SecurityItem[] = [
  ["Path traversal protection", "Live Server resolves file paths against the workspace root and blocks boundary escapes."],
  ["Shell injection prevention", "Terminal commands escape arguments and validate PID input before any port-kill action."],
  ["XSS mitigation", "Error surfaces avoid reflecting raw URLs directly and escape response output before rendering."],
  ["Crypto-safe randomness", "The password generator uses rejection sampling instead of modulo-biased shortcuts."],
  ["Token redaction", "Persisted request history masks bearer tokens so sensitive data is not casually exposed."],
  ["Bounded I/O", "HTTP responses are capped and history files are guarded to keep memory and disk usage sane."],
];

export const QUICK_PILLS = [
  "Live reload",
  "Sidebar dashboard",
  "No setup tax",
  "Glass-fast workflow",
];

export const PREVIEW_STACK: PreviewItem[] = [
  { label: "HTTP", value: "7 methods" },
  { label: "Console", value: "9 actions" },
  { label: "Python", value: "11 tools" },
];

export const NAV_ITEMS: NavItem[] = [
  { id: "top", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "security", label: "Security" },
];

export const CABINET_ROLE_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full-stack Developer",
  "Python Developer",
  "Student",
  "Team Lead",
];

export const IMPROVEMENT_AREAS = [
  "UI / UX",
  "New commands",
  "Sidebar dashboard",
  "Performance",
  "Python tooling",
  "Documentation",
];

export const SUGGESTION_STATUS_OPTIONS = [
  "NEW",
  "REVIEWING",
  "PLANNED",
  "SHIPPED",
  "REJECTED",
] as const;

export const VSIX_FILE = "https://github.com/OleksandrShtyka/auto-check-standard/releases/download/0.0.11/autochecker-0.0.11.vsix";
export const VSIX_NAME = "autochecker-0.0.11.vsix";
export const INSTALL_CMD = `code --install-extension ${VSIX_NAME}`;
export const MARKETPLACE = "https://marketplace.visualstudio.com/items?itemName=shtyka-dev.autochecker";
export const GITHUB = "https://github.com/OleksandrShtyka/auto-check-standard";
export const VSCODE_MAC_URL = "https://code.visualstudio.com/sha/download?build=stable&os=darwin-universal-dmg";
