"use client";

import { useRouter } from "next/navigation";
import { LandingPage } from "../components/LandingPage";
import { saveStoredIdentity } from "../data/identity";
import type { BrowserLoginOutcome } from "../data/oauth";
import { markEnterAfterLogin } from "../data/oauth";
import { setSessionToken } from "../data/platform";

export default function HomePage() {
  const router = useRouter();

  const enterChatroom = (outcome: BrowserLoginOutcome) => {
    saveStoredIdentity({
      actorId: outcome.actor.id,
      token: outcome.session.token,
    });
    setSessionToken(outcome.session.token);
    markEnterAfterLogin();
    router.replace("/chatroom");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0b0b0b] text-zinc-100">
      <LandingPage onSignedIn={enterChatroom} />
    </div>
  );
}
