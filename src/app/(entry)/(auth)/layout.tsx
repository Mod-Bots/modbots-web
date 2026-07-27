import type { ReactNode } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function Layout({ children }: { children: ReactNode }) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
