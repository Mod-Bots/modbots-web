"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveStoredIdentity } from "@/data/identity";
import type { BrowserLoginOutcome, BrowserLoginSession } from "@/data/oauth";
import {
  accountBaseUrl,
  getBrowserLoginSession,
  markEnterAfterLogin,
} from "@/data/oauth";
import { setSessionToken } from "@/data/platform";
import { uidQuery, useLaunchUid } from "@/hooks/useAuthRoute";

export function RegisterForm() {
  const router = useRouter();
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const boundBrowserSession = useRef<BrowserLoginSession | null>(null);
  const uid = useLaunchUid();
  const accountFormReady = uid !== null || loginUrl !== null;

  const onSignedIn = useCallback(
    (outcome: BrowserLoginOutcome) => {
      saveStoredIdentity({
        actorId: outcome.actor.id,
        token: outcome.session.token,
      });
      setSessionToken(outcome.session.token);
      markEnterAfterLogin();
      router.replace("/chatroom");
    },
    [router],
  );

  const bindBrowserSession = useCallback(
    (prepared: BrowserLoginSession) => {
      setLoginUrl(prepared.authorizeUrl);

      if (boundBrowserSession.current === prepared) {
        return prepared;
      }

      boundBrowserSession.current = prepared;
      prepared.automatic.then(
        (outcome) => {
          if (boundBrowserSession.current === prepared) {
            onSignedIn(outcome);
          }
        },
        () => {
          if (boundBrowserSession.current !== prepared) {
            return;
          }

          boundBrowserSession.current = null;
          setLoginUrl((current) =>
            current === prepared.authorizeUrl ? null : current,
          );
        },
      );

      return prepared;
    },
    [onSignedIn],
  );

  useEffect(() => {
    let cancelled = false;

    void getBrowserLoginSession("register")
      .then((prepared) => {
        if (cancelled) {
          return;
        }

        bindBrowserSession(prepared);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setLoginUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [bindBrowserSession]);

  return (
    <>
      <form
        method="post"
        action={`${accountBaseUrl}/register`}
        onSubmit={(event) => {
          if (!accountFormReady) {
            event.preventDefault();
          }
        }}
        noValidate
        className="mt-8 rounded-window border border-white/10 bg-modbots-card p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
      >
        {uid !== null ? <input type="hidden" name="uid" value={uid} /> : null}
        {uid === null && loginUrl !== null ? (
          <input type="hidden" name="returnTo" value={loginUrl} />
        ) : null}
        <input type="hidden" name="screen" value="register" />

        <label
          className="block text-sm font-medium text-zinc-300"
          htmlFor="username"
        >
          Username
        </label>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-modbots-inset px-3 py-2.5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/25"
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          aria-invalid="false"
          defaultValue=""
        />
        <p className="mt-1 text-xs text-zinc-400">
          3 to 64 letters, numbers, underscores, or hyphens. This is yours
          alone.
        </p>

        <label
          className="mt-4 block text-sm font-medium text-zinc-300"
          htmlFor="displayName"
        >
          Display name{" "}
          <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-modbots-inset px-3 py-2.5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/25"
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          defaultValue=""
        />

        <label
          className="mt-4 block text-sm font-medium text-zinc-300"
          htmlFor="password"
        >
          Password
        </label>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-modbots-inset px-3 py-2.5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/25"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid="false"
        />
        <p className="mt-1 text-xs text-zinc-400">8 to 200 characters.</p>

        <label className="mt-5 flex items-start gap-2.5 text-sm text-zinc-400">
          <input
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-modbots-inset"
            type="checkbox"
            name="acceptPolicy"
          />
          <span>
            I accept the{" "}
            <a
              className="font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 hover:text-white"
              href="/terms-of-use"
              target="_blank"
              rel="noreferrer"
            >
              Terms of use
            </a>
          </span>
        </label>
        <p className="mt-1 min-h-[1rem] text-xs text-zinc-200" />

        <button
          className="mt-6 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-60"
          type="submit"
          disabled={!accountFormReady}
        >
          Create account
        </button>
      </form>

      {uid !== null ? (
        <form
          method="post"
          action={`${accountBaseUrl}/login/cancel`}
          className="mt-5 text-center"
        >
          <input type="hidden" name="uid" value={uid} />
          <button
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
            type="submit"
          >
            Cancel and return to the app
          </button>
        </form>
      ) : null}

      <p className="mt-5 text-center text-sm text-zinc-500">
        <a
          className="font-medium text-zinc-300 hover:text-white"
          href={`/login${uidQuery(uid)}`}
        >
          Log in
        </a>{" "}
        with an account or as a guest.
      </p>
    </>
  );
}
