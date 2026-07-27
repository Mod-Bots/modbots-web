import Image from "next/image";
import Link from "next/link";
import notFoundImage from "../assets/404-page.png";
import { Footer } from "@/components/entry/Footer";

const NotFoundPage = (): React.ReactElement => (
  <div className="modbots-scroll flex h-screen h-dvh flex-col overflow-y-auto bg-[#0b0b0b] text-zinc-100">
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      <Image
        src={notFoundImage}
        alt=""
        priority
        sizes="(max-width: 640px) 100vw, 560px"
        className="h-auto w-full max-w-[560px]"
      />
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Page not found
      </h1>
      <Link
        className="text-sm font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition hover:text-white hover:decoration-zinc-400"
        href="/"
      >
        Return to Mod Bots
      </Link>
    </main>
    <Footer />
  </div>
);

export default NotFoundPage;
