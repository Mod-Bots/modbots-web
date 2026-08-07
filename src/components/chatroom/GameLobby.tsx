"use client";

import {
  ArrowLeft,
  Clock3,
  Eye,
  Gamepad2,
  LoaderCircle,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Actor, GameSession } from "@/data/contracts";
import { roomGameCatalog } from "@/data/game-catalog";
import { useRoomGames } from "@/hooks/useRoomGames";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";

const playerRange = (minimum: number, maximum: number): string =>
  minimum === maximum ? String(maximum) : `${minimum}-${maximum}`;

const isRunning = (game: GameSession): boolean =>
  game.state === "waiting" || game.state === "active";

const boardCellIds = [
  "top-left",
  "top-centre",
  "top-right",
  "middle-left",
  "centre",
  "middle-right",
  "bottom-left",
  "bottom-centre",
  "bottom-right",
] as const;

function TicTacToeGame({
  game,
  actorId,
  actors,
  busy,
  onBack,
  onMove,
  onLeave,
  onRematch,
}: {
  game: GameSession;
  actorId: string | undefined;
  actors: Map<string, Actor>;
  busy: boolean;
  onBack: () => void;
  onMove: (cell: number) => void;
  onLeave: () => void;
  onRematch: () => void;
}) {
  const { t } = useUiLanguage();
  const playerX = actors.get(game.playerXActorId)?.display ?? t("Player X");
  const playerO =
    game.playerOActorId === null
      ? t("Waiting for player")
      : (actors.get(game.playerOActorId)?.display ?? t("Player O"));
  const localMark =
    actorId === game.playerXActorId
      ? "X"
      : actorId === game.playerOActorId
        ? "O"
        : null;
  const isPlayer = localMark !== null;
  const isSpectator =
    actorId !== undefined && game.spectatorActorIds.includes(actorId);
  const yourTurn = game.state === "active" && localMark === game.nextMark;
  const winnerName =
    game.winnerActorId === null
      ? null
      : (actors.get(game.winnerActorId)?.display ?? t("The other player"));
  const message =
    game.state === "waiting"
      ? t("Waiting for another player to join")
      : game.state === "draw"
        ? t("The game ended in a draw")
        : game.state === "cancelled"
          ? t("This game was cancelled")
          : game.state === "won"
            ? game.winnerActorId === actorId
              ? t("You won!")
              : `${winnerName} ${t("won the game")}`
            : isSpectator
              ? `${actors.get(game.nextMark === "X" ? game.playerXActorId : (game.playerOActorId ?? ""))?.display ?? t("A player")} ${t("is thinking")}`
              : yourTurn
                ? t("Your turn")
                : t("Waiting for the other player");
  const rematchRequested =
    actorId !== undefined && game.rematchRequestedBy.includes(actorId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-5 sm:px-7 sm:py-7">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex w-fit items-center gap-2 text-[12px] font-medium text-zinc-500 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Game lobby")}
      </button>
      <div className="rounded-window border border-white/[0.09] bg-white/[0.025] p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              {t("Tic-tac-toe")}
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">{message}</p>
          </div>
          {isSpectator ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400">
              <Eye className="h-3.5 w-3.5" /> {t("Watching")}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-white/[0.07] bg-black/15 px-4 py-3 text-center">
          <div
            className={
              game.nextMark === "X" && game.state === "active"
                ? "text-white"
                : "text-zinc-500"
            }
          >
            <div className="text-xl font-bold">X</div>
            <div className="truncate text-[12px]">{playerX}</div>
          </div>
          <span className="text-[11px] uppercase tracking-widest text-zinc-700">
            {t("versus")}
          </span>
          <div
            className={
              game.nextMark === "O" && game.state === "active"
                ? "text-white"
                : "text-zinc-500"
            }
          >
            <div className="text-xl font-bold">O</div>
            <div className="truncate text-[12px]">{playerO}</div>
          </div>
        </div>

        <fieldset className="mx-auto mt-7 grid w-full max-w-[330px] grid-cols-3 gap-2">
          <legend className="sr-only">{t("Tic-tac-toe board")}</legend>
          {game.board.map((mark, index) => {
            const winning = game.winningLine?.includes(index) ?? false;
            const enabled = yourTurn && mark === null && !busy;
            return (
              <button
                key={boardCellIds[index]}
                type="button"
                disabled={!enabled}
                onClick={() => onMove(index)}
                aria-label={
                  mark === null
                    ? `${t("Empty cell")} ${index + 1}`
                    : `${mark} ${t("in cell")} ${index + 1}`
                }
                className={`aspect-square rounded-xl border text-4xl font-semibold transition-colors ${winning ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200" : "border-white/[0.09] bg-black/20 text-zinc-100"} ${enabled ? "cursor-pointer hover:border-white/30 hover:bg-white/[0.07]" : "cursor-default"}`}
              >
                {mark}
              </button>
            );
          })}
        </fieldset>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {isPlayer && (game.state === "won" || game.state === "draw") ? (
            <button
              type="button"
              disabled={busy || rematchRequested}
              onClick={onRematch}
              className="rounded-lg bg-zinc-100 px-4 py-2.5 text-[12px] font-semibold text-zinc-950 disabled:opacity-50"
            >
              {rematchRequested ? t("Waiting for rematch") : t("Play again")}
            </button>
          ) : null}
          {(isPlayer || isSpectator) && isRunning(game) ? (
            <button
              type="button"
              disabled={busy}
              onClick={onLeave}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-[12px] font-semibold text-zinc-300 hover:bg-white/[0.05] disabled:opacity-50"
            >
              {game.state === "waiting" && isPlayer
                ? t("Cancel game")
                : isSpectator
                  ? t("Stop watching")
                  : t("Resign")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function GameLobby({
  roomId,
  actorId,
  actors,
}: {
  roomId: string;
  actorId: string | undefined;
  actors: Map<string, Actor>;
}) {
  const { t } = useUiLanguage();
  const games = useRoomGames(roomId, actorId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const sessions = games.sessions.data?.sessions ?? [];
  const selected = sessions.find((game) => game.id === selectedId) ?? null;
  const running = sessions.filter(isRunning);
  const recent = sessions
    .filter((game) => game.state === "won" || game.state === "draw")
    .slice(0, 6);
  const busy =
    games.create.isPending ||
    games.join.isPending ||
    games.watch.isPending ||
    games.move.isPending ||
    games.leave.isPending ||
    games.rematch.isPending;

  useEffect(() => {
    if (
      selected?.rematchSessionId !== null &&
      selected?.rematchSessionId !== undefined
    )
      setSelectedId(selected.rematchSessionId);
  }, [selected?.rematchSessionId]);

  const act = async (operation: () => Promise<{ session: GameSession }>) => {
    setActionError(null);
    try {
      const result = await operation();
      setSelectedId(result.session.id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("The game action failed"),
      );
    }
  };

  if (selected !== null) {
    return (
      <div
        key="game-view"
        className="modbots-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <TicTacToeGame
          game={selected}
          actorId={actorId}
          actors={actors}
          busy={busy}
          onBack={() => setSelectedId(null)}
          onMove={(cell) =>
            void act(() =>
              games.move.mutateAsync({ gameId: selected.id, cell }),
            )
          }
          onLeave={() => void act(() => games.leave.mutateAsync(selected.id))}
          onRematch={() =>
            void act(() => games.rematch.mutateAsync(selected.id))
          }
        />
        {actionError ? (
          <p className="mx-auto mb-5 max-w-3xl px-7 text-center text-[12px] text-red-300">
            {actionError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      key="lobby-view"
      className="modbots-scroll min-h-0 flex-1 overflow-y-auto"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-7 sm:py-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              {t("Games")}
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              {t(
                "Start a table, join other players, or watch a game in progress.",
              )}
            </p>
          </div>
        </div>

        {actionError ? (
          <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-[12px] text-red-300">
            {actionError}
          </p>
        ) : null}

        <section className="mt-7" aria-labelledby="active-games-heading">
          <div className="flex items-center justify-between">
            <h3
              id="active-games-heading"
              className="text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
            >
              {t("Active games")}
            </h3>
            <span className="text-[11px] text-zinc-600">{running.length}</span>
          </div>
          {games.sessions.isLoading ? (
            <div className="mt-3 flex h-24 items-center justify-center">
              <LoaderCircle className="h-5 w-5 animate-spin text-zinc-600" />
            </div>
          ) : running.length === 0 ? (
            <div className="mt-3 flex min-h-24 items-center justify-center rounded-window border border-dashed border-white/10 bg-white/[0.015] px-5 text-center">
              <div>
                <p className="text-[13px] font-medium text-zinc-400">
                  {t("No games are running yet")}
                </p>
                <p className="mt-1 text-[12px] text-zinc-600">
                  {t("Start the first table below.")}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {running.map((game) => {
                const participant =
                  actorId === game.playerXActorId ||
                  actorId === game.playerOActorId;
                const watching =
                  actorId !== undefined &&
                  game.spectatorActorIds.includes(actorId);
                const host =
                  actors.get(game.playerXActorId)?.display ?? t("A player");
                return (
                  <article
                    key={game.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-zinc-200">
                        {t("Tic-tac-toe with")} {host}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-zinc-600">
                        {game.state === "waiting" ? (
                          t("Waiting for a player")
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />{" "}
                            {game.spectatorActorIds.length} {t("watching")}
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy || actorId === undefined}
                      onClick={() =>
                        participant || watching
                          ? setSelectedId(game.id)
                          : void act(() =>
                              game.state === "waiting"
                                ? games.join.mutateAsync(game.id)
                                : games.watch.mutateAsync(game.id),
                            )
                      }
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/[0.05] disabled:opacity-40"
                    >
                      {participant || watching
                        ? t("Open")
                        : game.state === "waiting"
                          ? t("Join")
                          : t("Watch")}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {recent.length > 0 ? (
          <section className="mt-7" aria-labelledby="recent-games-heading">
            <div className="flex items-center justify-between">
              <h3
                id="recent-games-heading"
                className="text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
              >
                {t("Recent games")}
              </h3>
              <span className="text-[11px] text-zinc-600">{recent.length}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recent.map((game) => {
                const result =
                  game.state === "draw"
                    ? t("Draw")
                    : `${actors.get(game.winnerActorId ?? "")?.display ?? t("A player")} ${t("won")}`;
                return (
                  <article
                    key={game.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-zinc-300">
                        {t("Tic-tac-toe")}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-zinc-600">
                        {result}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(game.id)}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-semibold text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                    >
                      {t("View result")}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

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
                className="flex min-h-48 flex-col rounded-window border border-white/[0.08] bg-white/[0.025] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-zinc-400">
                    {game.playable ? (
                      <Trophy className="h-[18px] w-[18px]" />
                    ) : (
                      <Gamepad2 className="h-[18px] w-[18px]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-zinc-200">
                      {t(game.name)}
                    </h4>
                    <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                      {t(game.description)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-[11px] text-zinc-600">
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
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-zinc-500">
                    {t(game.playable ? "Ready to play" : "Coming soon")}
                  </span>
                  <button
                    type="button"
                    disabled={!game.playable || actorId === undefined || busy}
                    onClick={() => void act(() => games.create.mutateAsync())}
                    className="rounded-lg bg-zinc-100 px-3 py-2 text-[12px] font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
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
