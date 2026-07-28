"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

const googleAnalyticsId = "G-YKZJGLJLD6";
const storageKey = "modbots.cookie-consent.v1";

export type CookieChoice = "accepted" | "rejected";

const readChoice = (): CookieChoice | null => {
  try {
    const stored = window.localStorage.getItem(storageKey);

    return stored === "accepted" || stored === "rejected" ? stored : null;
  } catch {
    return null;
  }
};

// Rejecting has to remove what a previous acceptance dropped, otherwise the
// choice only stops future collection and leaves the identifiers in place.
const clearAnalyticsCookies = (): void => {
  const domains = [
    window.location.hostname,
    `.${window.location.hostname}`,
    `.${window.location.hostname.split(".").slice(-2).join(".")}`,
  ];

  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim() ?? "";

    if (!name.startsWith("_ga") && !name.startsWith("_gid")) {
      continue;
    }

    for (const domain of domains) {
      // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API
      // cannot expire a cookie set on a parent domain, which is exactly where
      // Google Analytics puts these, and Safari does not implement it at all.
      document.cookie =
        `${name}=; path=/; domain=${domain}; ` +
        "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    // biome-ignore lint/suspicious/noDocumentCookie: as above, for the
    // host-only variant.
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
};

const writeChoice = (choice: CookieChoice): void => {
  try {
    window.localStorage.setItem(storageKey, choice);
  } catch {
    // A blocked storage API only means the banner asks again next visit.
  }

  if (choice === "rejected") {
    clearAnalyticsCookies();
  }

  window.dispatchEvent(new CustomEvent("modbots:cookie-choice"));
};

const useCookieChoice = (): [CookieChoice | null, boolean] => {
  const [choice, setChoice] = useState<CookieChoice | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const sync = (): void => {
      setChoice(readChoice());
      setSettled(true);
    };

    sync();
    window.addEventListener("modbots:cookie-choice", sync);

    return () => window.removeEventListener("modbots:cookie-choice", sync);
  }, []);

  return [choice, settled];
};

export const CookieConsent = (): React.ReactElement | null => {
  const [choice, settled] = useCookieChoice();

  const decide = useCallback((next: CookieChoice) => {
    writeChoice(next);
  }, []);

  if (!settled) {
    return null;
  }

  if (choice === "accepted") {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
          `}
        </Script>
      </>
    );
  }

  if (choice === "rejected") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6">
      <section
        aria-label="Cookies"
        className="pointer-events-auto mx-auto flex w-full max-w-[860px] flex-col gap-5 rounded-window border border-white/10 bg-modbots-card/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6 sm:p-6"
      >
        <p className="text-sm leading-6 text-zinc-300">
          We would like to measure how this site is used, which needs analytics
          cookies. Nothing non-essential is set unless you agree, and the site
          works either way.{" "}
          <Link
            className="text-zinc-200 underline decoration-zinc-600 underline-offset-[5px] transition-colors hover:text-white hover:decoration-zinc-400"
            href="/cookies"
            prefetch={false}
          >
            What these cookies do
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            className="flex-1 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-white/30 hover:text-white sm:flex-none"
            onClick={() => decide("rejected")}
            type="button"
          >
            No thanks
          </button>
          <button
            className="flex-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 sm:flex-none"
            onClick={() => decide("accepted")}
            type="button"
          >
            Allow
          </button>
        </div>
      </section>
    </div>
  );
};

export const CookieChoicePanel = (): React.ReactElement => {
  const [choice, settled] = useCookieChoice();

  const decide = useCallback((next: CookieChoice) => {
    writeChoice(next);
  }, []);

  const status = !settled
    ? "Checking your current choice."
    : choice === "accepted"
      ? "Analytics cookies are currently allowed on this browser."
      : choice === "rejected"
        ? "Analytics cookies are currently turned off on this browser."
        : "You have not made a choice on this browser yet.";

  return (
    <div className="mt-10 rounded-window border border-white/[0.07] bg-white/[0.02] p-6 sm:p-8">
      <h3 className="text-lg font-semibold tracking-[-0.015em] text-white">
        Your choice
      </h3>
      <p className="mt-3 text-[17px] leading-8 text-zinc-400">{status}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
          disabled={!settled || choice === "accepted"}
          onClick={() => decide("accepted")}
          type="button"
        >
          Allow analytics cookies
        </button>
        <button
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-white/30 hover:text-white disabled:opacity-40"
          disabled={!settled || choice === "rejected"}
          onClick={() => decide("rejected")}
          type="button"
        >
          Turn analytics cookies off
        </button>
      </div>
      <p className="mt-5 text-sm leading-6 text-zinc-500">
        The choice is stored on this browser only, so it is made again on
        another device. Turning analytics off also deletes the analytics cookies
        already set here.
      </p>
    </div>
  );
};
