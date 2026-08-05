export const Footer = (): React.ReactElement => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mx-auto mt-4 w-full max-w-[420px] shrink-0 px-6 pb-6 text-center text-[11px] leading-5 text-zinc-600">
      Copyright &copy; {currentYear} Mod Bots AI. All rights reserved.
    </footer>
  );
};
