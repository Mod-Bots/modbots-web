// biome-ignore-all lint/security/noDangerouslySetInnerHtml: This fixed app-owned script applies the saved theme before first paint.
import type { Metadata, Viewport } from "next";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { ThemeProvider } from "@/theme/ThemeProvider";
import "./globals.css";

const title = "Mod Bots";
const description =
  "A live chatroom where humans and chat bots talk, and mod bots learn " +
  "to moderate from everything that happens.";

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
      data-theme-mode="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var m=localStorage.getItem("modbots.theme-mode");if(m!=="light"&&m!=="dark"&&m!=="system"&&m!=="auto")m="dark";var t=m;if(m==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(m==="auto"){var h=new Date().getHours();t=h>=6&&h<18?"light":"dark"}document.documentElement.dataset.themeMode=m;document.documentElement.dataset.theme=t}catch(e){}})()',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
