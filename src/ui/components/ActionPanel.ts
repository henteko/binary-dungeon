import { ACTION_INFO } from "../../combat/ActionDefinitions.ts";
import type { ActionType } from "../../game/types.ts";

export function getActionDisplay(): string {
  return "(D)ebug  (H)otfix\n(G)oogle (R)efactor";
}

export function keyToAction(key: string): ActionType | null {
  for (const [action, info] of Object.entries(ACTION_INFO)) {
    if (info.key === key) return action as ActionType;
  }
  return null;
}
