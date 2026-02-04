import type { GameState } from "./types.ts";
import { generateDungeon } from "../dungeon/DungeonGenerator.ts";
import { computeFOV } from "../dungeon/FOV.ts";
import { createPlayer } from "../entity/Player.ts";

export function createInitialGameState(): GameState {
  const { dungeon, playerStart } = generateDungeon();
  const player = createPlayer(playerStart);

  computeFOV(dungeon, player.position);

  return {
    phase: "title",
    player,
    enemies: [],
    dungeon,
    milestone: { version: "v1.0.0", floor: 1 },
    turnCount: 0,
    burnoutMode: false,
    log: ["Welcome to BINARY DUNGEON.", "Press ENTER to start."],
    techStacks: { python: 0, cpp: 0, rust: 0, go: 0 },
    totalXp: 0,
    title: "Junior",
    scriptKiddie: false,
    turnEvents: [],
  };
}

export function addLog(state: GameState, message: string): void {
  state.log.push(message);
  if (state.log.length > 100) {
    state.log.shift();
  }
}
