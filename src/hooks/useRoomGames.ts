"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTicTacToe,
  getRoomGames,
  joinGame,
  leaveGame,
  playGameMove,
  requestGameRematch,
  watchGame,
} from "@/data/platform";

export const useRoomGames = (roomId: string, actorId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = ["room-games", roomId] as const;
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const sessions = useQuery({ queryKey, queryFn: () => getRoomGames(roomId) });
  const requireActor = (): string => {
    if (actorId === undefined) {
      throw new Error("Join the chatroom before playing.");
    }
    return actorId;
  };

  const create = useMutation({
    mutationFn: async () => createTicTacToe(roomId, requireActor()),
    onSuccess: refresh,
  });
  const join = useMutation({
    mutationFn: async (gameId: string) =>
      joinGame(roomId, gameId, requireActor()),
    onSuccess: refresh,
  });
  const watch = useMutation({
    mutationFn: async (gameId: string) =>
      watchGame(roomId, gameId, requireActor()),
    onSuccess: refresh,
  });
  const move = useMutation({
    mutationFn: async ({ gameId, cell }: { gameId: string; cell: number }) =>
      playGameMove(roomId, gameId, requireActor(), cell),
    onSuccess: refresh,
  });
  const leave = useMutation({
    mutationFn: async (gameId: string) =>
      leaveGame(roomId, gameId, requireActor()),
    onSuccess: refresh,
  });
  const rematch = useMutation({
    mutationFn: async (gameId: string) =>
      requestGameRematch(roomId, gameId, requireActor()),
    onSuccess: refresh,
  });

  return { sessions, create, join, watch, move, leave, rematch };
};
