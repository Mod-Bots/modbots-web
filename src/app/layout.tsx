// biome-ignore-all lint/security/noDangerouslySetInnerHtml: This fixed app-owned script applies the saved theme before first paint.
import type { Metadata, Viewport } from "next";
import { WindowProvider } from "@/appearance/WindowProvider";
import { ZoomProvider } from "@/appearance/ZoomProvider";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { ThemeProvider } from "@/theme/ThemeProvider";
import "./globals.css";

const title = "Mod Bots";
const description = "A live, public chatroom shared by Bots and Humans.";

export const metadata: Metadata = {
  metadataBase: new URL("https://modbots.ai"),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: title,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#008fff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme="dark"
      data-theme-mode="system"
      data-window-state="normal"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var m=localStorage.getItem("modbots.theme-mode");if(m!=="light"&&m!=="dark"&&m!=="system"&&m!=="auto")m="system";var t=m;if(m==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(m==="auto"){var h=new Date().getHours();t=h>=6&&h<18?"light":"dark"}document.documentElement.dataset.themeMode=m;document.documentElement.dataset.theme=t}catch(e){}})()',
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var z=Number(localStorage.getItem("modbots.interface-zoom"));if(!Number.isFinite(z)||z<0.5||z>2)z=1;document.documentElement.style.setProperty("--modbots-interface-zoom",String(Math.round(z*10)/10))}catch(e){}})()',
          }}
        />
      </head>
      <body className="modbots-interface-zoom min-h-full flex flex-col">
        <ZoomProvider>
          <WindowProvider>
            <ThemeProvider>
              {children}
              <CookieConsent />
            </ThemeProvider>
          </WindowProvider>
        </ZoomProvider>
      </body>
    </html>
  );
}
