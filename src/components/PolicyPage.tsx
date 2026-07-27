import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import appLogo from "../assets/logo.svg";
import { type PolicyContact, policyMeta } from "../data/policies";
import { BackPageFooter } from "./BackPageFooter";

// Typographic primitives for the published documents. They exist so seven
// policy pages cannot drift apart in type, rhythm, or link treatment.

export const P = ({
  children,
}: {
  children: ReactNode;
}): React.ReactElement => (
  <p className="mt-6 text-[17px] leading-8 text-zinc-400 sm:text-[19px] sm:leading-9">
    {children}
  </p>
);

export const Lead = ({
  children,
}: {
  children: ReactNode;
}): React.ReactElement => (
  <p className="mt-8 text-xl leading-9 text-zinc-300 sm:text-2xl sm:leading-10">
    {children}
  </p>
);

export const H2 = ({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}): React.ReactElement => (
  <h2
    className="mt-20 scroll-mt-24 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl"
    id={id}
  >
    {children}
  </h2>
);

export const H3 = ({
  children,
}: {
  children: ReactNode;
}): React.ReactElement => (
  <h3 className="mt-12 text-lg font-semibold tracking-[-0.015em] text-white sm:text-xl">
    {children}
  </h3>
);

export const UL = ({
  children,
}: {
  children: ReactNode;
}): React.ReactElement => (
  <ul className="mt-6 space-y-3 text-[17px] leading-8 text-zinc-400 sm:text-[19px] sm:leading-9">
    {children}
  </ul>
);

export const LI = ({
  children,
}: {
  children: ReactNode;
}): React.ReactElement => (
  <li className="relative pl-6 before:absolute before:left-0 before:top-[0.85em] before:h-[3px] before:w-[3px] before:rounded-full before:bg-zinc-600">
    {children}
  </li>
);

export const A = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}): React.ReactElement => {
  const className =
    "text-zinc-200 underline decoration-zinc-600 underline-offset-[5px] " +
    "transition-colors hover:text-white hover:decoration-zinc-400";

  if (href.startsWith("mailto:")) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return href.startsWith("http") ? (
    <a className={className} href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  ) : (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
};

// A route to whoever handles the thing being discussed. The team carries the
// sentence and the address rides along in plain sight, so the document reads
// as prose on screen and still works when it is printed.
export const Contact = ({
  route,
}: {
  route: PolicyContact;
}): React.ReactElement => (
  <A href={`mailto:${route.address}`}>
    {route.team} ({route.address})
  </A>
);

// A definition row, used where a document has to answer the same question for
// several categories at once without turning into an unreadable table.
export const Row = ({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}): React.ReactElement => (
  <div className="border-t border-white/[0.07] py-6 sm:grid sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-8">
    <dt className="text-[15px] font-semibold leading-7 text-zinc-200">
      {term}
    </dt>
    <dd className="mt-2 text-[17px] leading-8 text-zinc-400 sm:mt-0 sm:leading-7">
      {children}
    </dd>
  </div>
);

export const Rows = ({
  children,
}: {
  children: ReactNode;
}): React.ReactElement => (
  <dl className="mt-8 border-b border-white/[0.07]">{children}</dl>
);

export const PolicyPage = ({
  title,
  standfirst,
  children,
}: {
  title: string;
  standfirst: string;
  children: ReactNode;
}): React.ReactElement => (
  <div className="modbots-scroll h-screen h-dvh overflow-y-auto bg-[#0a0a0a] text-zinc-100">
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0a0a0a]/85 backdrop-blur-xl">
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
          href="/why-mod-bots-exists"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2}
          />
          Why Mod Bots exists
        </Link>
      </div>
    </header>

    <main className="mx-auto w-full max-w-[1100px] px-6 sm:px-10">
      <article className="mx-auto max-w-[720px] pb-24 pt-20 sm:pt-28">
        <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-[52px]">
          {title}
        </h1>
        <Lead>{standfirst}</Lead>
        <p className="mt-8 text-sm text-zinc-600">
          Version {policyMeta.version}. Last updated {policyMeta.updated}.
        </p>
        {children}
      </article>
    </main>

    <BackPageFooter />
  </div>
);
