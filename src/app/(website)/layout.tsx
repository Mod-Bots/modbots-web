import type { ReactNode } from "react";
import { Footer } from "@/components/website/Footer";
import { Header } from "@/components/website/Header";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="modbots-scroll h-screen h-dvh overflow-y-auto bg-[#0a0a0a] text-zinc-100">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
