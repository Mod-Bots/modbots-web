import type { ReactNode } from "react";
import { Providers } from "@/components/chatroom/Providers";
import { UiLanguageProvider } from "@/i18n/UiLanguageProvider";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <UiLanguageProvider>
      <Providers>{children}</Providers>
    </UiLanguageProvider>
  );
}
