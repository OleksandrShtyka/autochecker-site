import type { Metadata } from "next";
import { HomePage } from "@/features/home";
import { MARKETPLACE, GITHUB, RELEASE_VERSION } from "@/features/home/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autochecker.dev";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AutoChecker",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows, macOS, Linux",
  description:
    "61 commands. Zero dependencies. One sidebar. AutoChecker brings live server, HTTP client, code quality tools, generators, formatters, and Python helpers into a single polished VS Code extension.",
  url: SITE_URL,
  downloadUrl: MARKETPLACE,
  softwareVersion: RELEASE_VERSION,
  fileSize: "56 KB",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Oleksandr Shtyka",
    url: GITHUB,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "1",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Live Server with live reload",
    "HTTP Client with request history",
    "Console log management",
    "Code quality tools",
    "Code generation (hooks, routes, components)",
    "Frontend tools (Tailwind, CSS, fonts, colors)",
    "Formatters (JSON, JWT, string-case)",
    "Python tools (venv, generators, run helpers)",
    "Sidebar dashboard with 61 commands",
    "DX & productivity utilities",
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage />
    </>
  );
}
