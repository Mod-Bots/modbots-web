"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { saveStoredIdentity } from "@/data/identity";
import type { BrowserLoginOutcome, BrowserLoginSession } from "@/data/oauth";
import {
  accountBaseUrl,
  getBrowserLoginSession,
  markEnterAfterLogin,
  openInBrowser,
  resetBrowserLoginSession,
} from "@/data/oauth";
import { setSessionToken } from "@/data/platform";
import { uidQuery, useLaunchUid } from "@/hooks/useAuthRoute";

const browserLoginWaitMs = 90_000;

const loginFailureMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" && error.trim().length > 0
    ? error
    : fallback;
};

export function RegisterForm() {
  const router = useRouter();
  const [session, setSession] = useState<BrowserLoginSession | null>(null);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState("");
  const [codePending, setCodePending] = useState(false);
  const [preparingSession, setPreparingSession] = useState(false);
  const [waitingForBrowser, setWaitingForBrowser] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
      setSession(prepared);
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
        (error: unknown) => {
          if (boundBrowserSession.current !== prepared) {
            return;
          }

          boundBrowserSession.current = null;
          setSession((current) => (current === prepared ? null : current));
          setWaitingForBrowser(false);
          setLoginError(
            loginFailureMessage(error, "The Browser log-in did not complete."),
          );
        },
      );

      return prepared;
    },
    [onSignedIn],
  );

  const ensureBrowserSession = async (): Promise<BrowserLoginSession> => {
    if (session !== null) {
      return session;
    }

    setPreparingSession(true);

    try {
      return bindBrowserSession(await getBrowserLoginSession("register"));
    } finally {
      setPreparingSession(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    setPreparingSession(true);

    void getBrowserLoginSession("register")
      .then((prepared) => {
        if (cancelled) {
          return;
        }

        bindBrowserSession(prepared);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setLoginError(
          loginFailureMessage(error, "The log-in link could not be prepared."),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setPreparingSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bindBrowserSession]);

  const resetLoginFlow = useEffectEvent(async (message: string | null) => {
    boundBrowserSession.current = null;
    setAuthCode("");
    setCodePending(false);
    setPreparingSession(false);
    setWaitingForBrowser(false);
    setCopied(false);
    setSession(null);
    setLoginUrl(null);

    await resetBrowserLoginSession();
    setLoginError(message);
  });

  useEffect(() => {
    if (!waitingForBrowser || loginError !== null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void resetLoginFlow(
        "The Browser log-in took too long and was reset. Start again when you are ready.",
      );
    }, browserLoginWaitMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loginError, resetLoginFlow, waitingForBrowser]);

  const copyLoginUrl = async () => {
    setLoginError(null);

    try {
      const url = loginUrl ?? (await ensureBrowserSession()).authorizeUrl;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch (error) {
      setLoginError(
        loginFailureMessage(error, "The log-in link could not be prepared."),
      );
    }
  };

  const continueInBrowser = async () => {
    setLoginError(null);
    setWaitingForBrowser(true);

    try {
      const prepared = await ensureBrowserSession();
      await openInBrowser(prepared.authorizeUrl);
    } catch (error) {
      setWaitingForBrowser(false);
      setLoginError(
        loginFailureMessage(error, "The Browser log-in could not be started."),
      );
    }
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (codePending || authCode.trim().length === 0) {
      return;
    }

    setLoginError(null);
    setCodePending(true);

    try {
      const prepared = await ensureBrowserSession();
      const outcome = await prepared.completeWithCode(authCode);
      onSignedIn(outcome);
    } catch (error) {
      setLoginError(
        loginFailureMessage(error, "The authorization code was not accepted."),
      );
    } finally {
      setCodePending(false);
    }
  };

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
