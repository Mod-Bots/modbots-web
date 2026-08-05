"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { policyPages } from "@/data/policies";

// The shared website footer carries the published policy set, which is how a
// reader reaches the cookie notice from anywhere.
export const Footer = (): React.ReactElement => {
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-white/[0.07] bg-modbots-header">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-14 sm:px-10">
        <nav aria-label="Policies">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {policyPages.map(({ href, label }) => (
              <li key={href}>
                <Link
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                  href={href}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-10 text-[13px] leading-6 text-zinc-600">
          Copyright &copy; {year} Mod Bots AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
