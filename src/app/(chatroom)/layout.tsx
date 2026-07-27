import type { ReactNode } from "react";
import { Providers } from "@/components/chatroom/Providers";

export default function Layout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
