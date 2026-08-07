"use client";

import { Clock3, Gamepad2, UsersRound } from "lucide-react";
import { roomGameCatalog } from "@/data/game-catalog";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";

const playerRange = (minimum: number, maximum: number): string =>
  minimum === maximum ? String(maximum) : `${minimum}-${maximum}`;

export function GameLobby() {
  const { t } = useUiLanguage();

  return (
    <div className="modbots-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-7 sm:py-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-100">
              {t("Games")}
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-zinc-500">
              {t(
                "Start a table, join other players, or watch a game in progress.",
              )}
            </p>
          </div>
        </div>

        <section className="mt-7" aria-labelledby="active-games-heading">
          <div className="flex items-center justify-between gap-3">
            <h3
              id="active-games-heading"
              className="text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
            >
              {t("Active games")}
            </h3>
            <span className="text-[11px] tabular-nums text-zinc-600">0</span>
          </div>
          <div className="mt-3 flex min-h-24 items-center justify-center rounded-window border border-dashed border-white/10 bg-white/[0.015] px-5 text-center">
            <div>
              <p className="text-[13px] font-medium text-zinc-400">
                {t("No games are running yet")}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-zinc-600">
                {t("Game tables will appear here when play is available.")}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7" aria-labelledby="game-catalog-heading">
          <h3
            id="game-catalog-heading"
            className="text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
          >
            {t("Choose a game")}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {roomGameCatalog.map((game) => (
              <article
                key={game.id}
                className="flex min-h-48 flex-col rounded-window border border-white/[0.08] bg-white/[0.025] p-4 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/15 text-zinc-400">
                    <Gamepad2 className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-semibold text-zinc-200">
                      {t(game.name)}
                    </h4>
                    <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                      {t(game.description)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-600">
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound className="h-3.5 w-3.5" />
                    {playerRange(game.minimumPlayers, game.maximumPlayers)}{" "}
                    {t("players")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {game.estimatedMinutes} {t("min")}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                    {t("Coming soon")}
                  </span>
                  <button
                    type="button"
                    disabled
                    className="rounded-lg bg-zinc-800 px-3 py-2 text-[12px] font-semibold text-zinc-600 disabled:cursor-not-allowed"
                  >
                    {t("Start game")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
