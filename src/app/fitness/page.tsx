import type { Metadata } from "next";
import { FitnessPage } from "@/features/home";

export const metadata: Metadata = {
  title: "Fitness Tracker",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <FitnessPage />;
}
