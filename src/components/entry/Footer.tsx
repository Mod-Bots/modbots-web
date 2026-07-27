"use client";

import { useEffect, useState } from "react";

const useCurrentYear = (): number => {
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return year;
};

export const Footer = (): React.ReactElement => {
  const currentYear = useCurrentYear();

  return (
    <footer className="relative mx-auto mt-4 w-full max-w-[420px] shrink-0 px-6 pb-6 text-center text-[11px] leading-5 text-zinc-600">
      Copyright &copy; {currentYear} The Mod Bots Project. All rights reserved.
    </footer>
  );
};
