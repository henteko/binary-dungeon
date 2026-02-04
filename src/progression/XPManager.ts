import type { GameState } from "../game/types.ts";
import { TITLES, XP_PER_LEVEL } from "../game/constants.ts";

export function getTotalXpEarned(state: GameState): number {
  return state.totalXp;
}

export function getAvailableXp(state: GameState): number {
  const spent = getSpentXp(state);
  return state.totalXp - spent;
}

export function getSpentXp(state: GameState): number {
  const { python, cpp, rust, go } = state.techStacks;
  let spent = 0;
  for (let i = 0; i < python; i++) spent += (i + 1) * 30;
  for (let i = 0; i < cpp; i++) spent += (i + 1) * 30;
  for (let i = 0; i < rust; i++) spent += (i + 1) * 30;
  for (let i = 0; i < go; i++) spent += (i + 1) * 30;
  return spent;
}

export function updateTitle(state: GameState): void {
  if (state.scriptKiddie) return;

  const totalLevel = state.techStacks.python + state.techStacks.cpp +
    state.techStacks.rust + state.techStacks.go;

  if (totalLevel >= 30) {
    state.title = TITLES[4] ?? "Architect";
  } else if (totalLevel >= 20) {
    state.title = TITLES[3] ?? "Lead";
  } else if (totalLevel >= 10) {
    state.title = TITLES[2] ?? "Senior";
  } else if (totalLevel >= 4) {
    state.title = TITLES[1] ?? "Mid-level";
  } else {
    state.title = TITLES[0] ?? "Junior";
  }
}
