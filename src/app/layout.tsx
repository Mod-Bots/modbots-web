import type { Metadata, Viewport } from "next";
import { CookieConsent } from "@/components/shared/CookieConsent";
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
