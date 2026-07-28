import type { ReactNode } from "react";
import { Providers } from "@/components/chatroom/Providers";
import { UiLanguageProvider } from "@/i18n/UiLanguageProvider";
import { NotificationProvider } from "@/notifications/NotificationProvider";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <UiLanguageProvider>
      <NotificationProvider>
        <Providers>{children}</Providers>
      </NotificationProvider>
    </UiLanguageProvider>
  );
}
