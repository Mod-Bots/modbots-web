"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import appLogo from "@/assets/logo.svg";

export const Header = (): React.ReactElement => {
  const pathname = usePathname();
  const onWhyPage = pathname === "/why-mod-bots-exists";

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-modbots-chrome/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-6 sm:px-10">
        <Link
          className="flex items-center gap-3 text-[15px] font-semibold tracking-tight text-white"
          href="/"
        >
          <Image
            alt=""
            className="rounded-lg"
            height={30}
            src={appLogo}
            width={30}
          />
          Mod Bots
        </Link>

        <Link
          className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
          href={onWhyPage ? "/" : "/why-mod-bots-exists"}
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2}
          />
          {onWhyPage ? "Back" : "Why Mod Bots exists"}
        </Link>
      </div>
    </header>
  );
};
