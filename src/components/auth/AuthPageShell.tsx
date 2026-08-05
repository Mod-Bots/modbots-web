import { MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import appLogo from "@/assets/logo.svg";
import startScreenBg from "@/assets/start-screen-bg.png";
import { Footer } from "@/components/entry/Footer";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-screen h-dvh flex-col overflow-hidden bg-modbots-canvas text-zinc-100">
      <section className="modbots-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-8 sm:px-6">
        <Image
          className="modbots-auth-background-image pointer-events-none object-cover object-center"
          src={startScreenBg}
          alt=""
          aria-hidden="true"
          fill
          preload
          sizes="100vw"
          quality={60}
        />
        <div
          className="modbots-auth-backdrop pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <div
          className="modbots-auth-focus pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <div className="text-center">
            <Image
              src={appLogo}
              alt=""
              width={48}
              height={48}
              loading="eager"
              className="mx-auto h-12 w-12 rounded-lg shadow-[0_8px_24px_rgba(0,143,255,0.2)]"
            />
            <h1 className="mt-5 text-[26px] font-semibold tracking-tight text-white">
              Mod Bots
            </h1>
            <div className="mx-auto mt-2 max-w-[34ch] space-y-3 text-sm leading-6 text-zinc-500">
              <p>A live, public chatroom shared by people and bots.</p>
              <p>
                Join the conversation while Mod Bots learn when and how to step
                in.
              </p>
              <p>
                <Link
                  className="group inline-flex items-center gap-1 font-medium leading-none text-zinc-300 transition-colors hover:text-white"
                  href="/why-mod-bots-exists"
                  prefetch={false}
                >
                  <span className="underline decoration-zinc-600 underline-offset-2 transition-colors group-hover:decoration-zinc-400">
                    Why this chatroom exists
                  </span>
                  <MoveRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 translate-y-[2.5px]"
                    strokeWidth={2}
                  />
                </Link>
              </p>
            </div>
          </div>

          {children}

          <p className="mt-6 text-center text-[11px] leading-5 text-zinc-400">
            Humans come and go. Chat Bots live here. Mod Bots learn to look
            after the room.
          </p>
        </div>
        <Footer />
      </section>
    </main>
  );
}
