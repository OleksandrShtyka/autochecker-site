import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autochecker.dev";
const SITE_NAME = "AutoChecker";
const TITLE = "AutoChecker — All-in-One VS Code Extension";
const DESCRIPTION =
  "61 commands. Zero dependencies. One sidebar. AutoChecker brings live server, HTTP client, code quality tools, generators, formatters, and Python helpers into a single polished VS Code extension.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "vscode extension",
    "visual studio code",
    "developer tools",
    "live server",
    "http client",
    "code quality",
    "code generator",
    "python tools",
    "tailwind tools",
    "console log",
    "boilerplate generator",
    "vscode sidebar",
    "formatter",
    "jwt decoder",
    "kill port",
    "autochecker",
    "vs code toolkit",
    "productivity extension",
  ],
  authors: [{ name: "Oleksandr Shtyka", url: "https://github.com/OleksandrShtyka" }],
  creator: "Oleksandr Shtyka",
  publisher: SITE_NAME,
  category: "Developer Tools",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@shtyka_dev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
