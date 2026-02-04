import type { ActionType, GameState, Enemy } from "../game/types.ts";
import { ACTION_COSTS, ACTION_POWER, TECH_STACK_EFFECTS } from "../game/constants.ts";

export type ActionInfo = {
  name: string;
  key: string;
  description: string;
  costType: "mh" | "dl";
  baseCost: number;
};

export const ACTION_INFO: Record<ActionType, ActionInfo> = {
  debug: {
    name: "Debug",
    key: "d",
    description: "Single target attack (MH cost: low)",
    costType: "mh",
    baseCost: ACTION_COSTS.debug.mh,
  },
  hotfix: {
    name: "Hotfix",
    key: "h",
    description: "High damage, stunned next turn (MH cost: mid)",
    costType: "mh",
    baseCost: ACTION_COSTS.hotfix.mh,
  },
  google_it: {
    name: "Google It",
    key: "g",
    description: "Reveal room, show enemy info (DL cost)",
    costType: "dl",
    baseCost: ACTION_COSTS.google_it.dl,
  },
  refactor: {
    name: "Refactor",
    key: "r",
    description: "Defend + small MH heal (DL cost)",
    costType: "dl",
    baseCost: ACTION_COSTS.refactor.dl,
  },
};

export function getEffectiveMhCost(state: GameState, action: ActionType): number {
  const base = ACTION_COSTS[action].mh;
  if (action === "debug") {
    const reduction = state.techStacks.python * TECH_STACK_EFFECTS.python.mhCostReduction;
    return Math.max(1, Math.floor(base * (1 - reduction)));
  }
  return base;
}

export function getEffectiveDlCost(state: GameState, action: ActionType): number {
  const base = ACTION_COSTS[action].dl;
  if (action === "google_it") {
    const reduction = state.techStacks.go * TECH_STACK_EFFECTS.go.dlCostReduction;
    return Math.max(1, Math.floor(base * (1 - reduction)));
  }
  return base;
}

export function getDebugDamage(state: GameState): number {
  return ACTION_POWER.debug;
}

export function getHotfixDamage(state: GameState): number {
  const base = ACTION_POWER.hotfix;
  const bonus = state.techStacks.cpp * TECH_STACK_EFFECTS.cpp.hotfixPowerBonus;
  return Math.floor(base * (1 + bonus));
}

export function getRefactorDefense(state: GameState): number {
  const base = ACTION_POWER.refactor_defense;
  const bonus = state.techStacks.rust * TECH_STACK_EFFECTS.rust.defenseBonus;
  return base * (1 - bonus);
}

export function getRefactorHeal(): number {
  return ACTION_POWER.refactor_heal;
}
