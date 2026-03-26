import type { Metadata } from "next";
import { AdminPage } from "@/features/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminPage />;
}
