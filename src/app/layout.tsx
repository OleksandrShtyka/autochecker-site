import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoChecker — All-in-One VS Code Toolkit",
  description:
    "60+ tools in one extension. Live server, HTTP client, code quality, generators, formatters, Python tools — zero dependencies.",
  keywords: [
    "vscode",
    "extension",
    "developer tools",
    "boilerplate",
    "live server",
    "console log",
    "http client",
    "python",
    "tailwind",
    "code quality",
  ],
  authors: [{ name: "Oleksandr Shtyka", url: "https://github.com/OleksandrShtyka" }],
  openGraph: {
    title: "AutoChecker — All-in-One VS Code Toolkit",
    description: "60+ tools in one extension. Zero dependencies. One sidebar.",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
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
