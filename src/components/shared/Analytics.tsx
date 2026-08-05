"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

const googleAnalyticsId = "G-YKZJGLJLD6";
const microsoftClarityId = "xxj6j0iy2f";
const noticeStorageKey = "modbots.cookie-notice.v1";
const formerConsentStorageKey = "modbots.cookie-consent.v1";

export const Analytics = (): React.ReactElement => {
  const [noticeAcknowledged, setNoticeAcknowledged] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    try {
      window.localStorage.removeItem(formerConsentStorageKey);
      setNoticeAcknowledged(
        window.localStorage.getItem(noticeStorageKey) === "acknowledged",
      );
    } catch {
      setNoticeAcknowledged(false);
    }
  }, []);

  const acknowledgeNotice = useCallback(() => {
    try {
      window.localStorage.setItem(noticeStorageKey, "acknowledged");
    } catch {
      // The notice can still be dismissed for the current page.
    }

    setNoticeAcknowledged(true);
  }, []);

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
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}');
        `}
      </Script>
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${microsoftClarityId}");
          window.clarity('consentv2', {
            analytics_Storage: 'granted',
            ad_Storage: 'denied'
          });
        `}
      </Script>

      {noticeAcknowledged === false ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6">
          <section
            aria-label="Analytics cookies"
            className="pointer-events-auto mx-auto flex w-full max-w-[860px] flex-col gap-5 rounded-window border border-white/10 bg-modbots-card/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6 sm:p-6"
          >
            <p className="text-sm leading-6 text-zinc-300">
              Mod Bots uses analytics cookies to understand how the site is used
              and improve it. Google Analytics and Microsoft Clarity provide
              these measurements.{" "}
              <Link
                className="text-zinc-200 underline decoration-zinc-600 underline-offset-[5px] transition-colors hover:text-white hover:decoration-zinc-400"
                href="/cookies"
                prefetch={false}
              >
                What these cookies do
              </Link>
              .
            </p>
            <button
              className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              onClick={acknowledgeNotice}
              type="button"
            >
              Understood
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
};
