import Image from "next/image";
import Link from "next/link";
import notFoundImage from "../assets/404-page.png";
import { SiteFooter } from "../components/SiteFooter";

const NotFoundPage = (): React.ReactElement => (
  <div className="flex min-h-screen min-h-dvh flex-col bg-[#0b0b0b] text-zinc-100">
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      <h1 className="sr-only">404: Page not found</h1>
      <Image
        src={notFoundImage}
        alt="404 page not found, illustrated with mod bots searching for the missing page"
        priority
        className="h-auto w-full max-w-[1200px]"
      />
      <Link
        className="mt-4 text-sm font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition hover:text-white hover:decoration-zinc-400"
        href="/"
      >
        Return to Mod Bots
      </Link>
    </main>
    <SiteFooter />
  </div>
);

export default NotFoundPage;
