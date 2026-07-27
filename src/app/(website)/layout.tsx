import type { ReactNode } from "react";
import { WebsiteFooter } from "@/components/WebsiteFooter";
import { WebsiteHeader } from "@/components/WebsiteHeader";

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="modbots-scroll h-screen h-dvh overflow-y-auto bg-[#0a0a0a] text-zinc-100">
      <WebsiteHeader />
      <main>{children}</main>
      <WebsiteFooter />
    </div>
  );
}
