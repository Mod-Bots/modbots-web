"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadStoredIdentity } from "@/data/identity";
import { accountBaseUrl, getBrowserLoginSession } from "@/data/oauth";
import { uidQuery, useLaunchUid } from "@/hooks/useAuthRoute";

export function LoginForm() {
  const router = useRouter();
  const uid = useLaunchUid();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const accountFormReady = uid !== null || returnTo !== null;

  useEffect(() => {
    const desktopLogin = new URLSearchParams(window.location.search).has("uid");

    if (uid !== null || desktopLogin) {
      return undefined;
    }

    if (loadStoredIdentity() !== null) {
      router.replace("/chatroom");
      return undefined;
    }

    let cancelled = false;

    void getBrowserLoginSession("login")
      .then((session) => {
        if (!cancelled) {
          setReturnTo(session.authorizeUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReturnTo(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, uid]);

  return (
    <>
      <form
        method="post"
        action={`${accountBaseUrl}/login`}
        onSubmit={(event) => {
          if (!accountFormReady) {
            event.preventDefault();
          }
        }}
        noValidate
        className="mt-8 rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
      >
        {uid !== null ? <input type="hidden" name="uid" value={uid} /> : null}
        {uid === null && returnTo !== null ? (
          <input type="hidden" name="returnTo" value={returnTo} />
        ) : null}
        <input type="hidden" name="screen" value="login" />

        <label
          className="flex cursor-pointer items-start gap-3"
          htmlFor="acceptPolicy"
        >
          <input
            className="peer sr-only"
            id="acceptPolicy"
            type="checkbox"
            name="acceptPolicy"
            required
          />
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-600 text-transparent transition-colors hover:border-zinc-400 peer-checked:border-white peer-checked:bg-white peer-checked:text-black peer-focus-visible:ring-2 peer-focus-visible:ring-white/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#141414]">
            <svg
              className="h-3 w-3"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 6.25 4.75 8.5 9.5 3.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-[13px] leading-5 text-zinc-400">
            I accept the{" "}
            <a
              className="font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-white hover:decoration-zinc-400"
              href="/terms-of-use"
              target="_blank"
              rel="noreferrer"
            >
              Terms of use
            </a>
          </span>
        </label>

        <h2 className="mt-5 text-sm font-semibold text-zinc-100">
          Log in as user
        </h2>

        <label className="mt-3 block" htmlFor="username">
          <span className="text-xs font-medium text-zinc-400">Username</span>
        </label>
        <input
          className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#181818] px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/25"
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          aria-invalid="false"
          defaultValue=""
        />

        <label className="mt-3 block" htmlFor="password">
          <span className="text-xs font-medium text-zinc-400">Password</span>
        </label>
        <input
          className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#181818] px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/25"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid="false"
        />

        <button
          className="mt-4 flex h-11 w-full items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414] disabled:pointer-events-none disabled:opacity-60"
          type="submit"
          disabled={!accountFormReady}
        >
          Log in
        </button>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
            OR
          </span>
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <h2 className="text-sm font-semibold text-zinc-100">Log in as guest</h2>

        <label className="mt-3 block" htmlFor="displayName">
          <span className="text-xs font-medium text-zinc-400">
            Display name{" "}
            <span className="font-normal text-zinc-400">(optional)</span>
          </span>
          <input
            className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#181818] px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/25"
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            placeholder="How the room sees you"
            defaultValue=""
          />
        </label>

        <button
          className="mt-4 flex h-11 w-full items-center justify-center rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-60"
          type="submit"
          formAction={`${accountBaseUrl}/login/guest`}
          disabled={!accountFormReady}
        >
          Log in
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
        New here?{" "}
        <a
          className="font-medium text-zinc-300 hover:text-white"
          href={`/${uidQuery(uid)}`}
        >
          Create an account
        </a>
      </p>
    </>
  );
}
