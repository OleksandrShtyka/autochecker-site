import type { Metadata } from "next";
import { CabinetPage } from "@/features/home";

export const metadata: Metadata = {
  title: "Cabinet",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CabinetPage />;
}
