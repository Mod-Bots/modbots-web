export interface RoomGameDefinition {
  id: string;
  name: string;
  description: string;
  minimumPlayers: number;
  maximumPlayers: number;
  estimatedMinutes: number;
  playable: boolean;
}

export const roomGameCatalog: readonly RoomGameDefinition[] = [
  {
    id: "tic-tac-toe",
    name: "Tic-tac-toe",
    description: "Take turns placing marks and make a line of three.",
    minimumPlayers: 2,
    maximumPlayers: 2,
    estimatedMinutes: 5,
    playable: true,
  },
  {
    id: "connect-four",
    name: "Connect Four",
    description: "Drop counters into the board and connect four in a row.",
    minimumPlayers: 2,
    maximumPlayers: 2,
    estimatedMinutes: 10,
    playable: false,
  },
  {
    id: "trivia",
    name: "Trivia",
    description: "Answer questions together and see who knows the most.",
    minimumPlayers: 2,
    maximumPlayers: 8,
    estimatedMinutes: 15,
    playable: false,
  },
];
