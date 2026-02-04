import type { Player, Position } from "../game/types.ts";
import { INITIAL_MH, INITIAL_DL } from "../game/constants.ts";

export function createPlayer(position: Position): Player {
  return {
    id: "player",
    type: "player",
    position: { ...position },
    name: "Dev_User",
    mh: INITIAL_MH,
    maxMh: INITIAL_MH,
    dl: INITIAL_DL,
    maxDl: INITIAL_DL,
    xp: 0,
    stunned: false,
    defending: false,
    defenseMultiplier: 1.0,
  };
}

export function healMh(player: Player, amount: number): number {
  const before = player.mh;
  player.mh = Math.min(player.maxMh, player.mh + amount);
  return player.mh - before;
}

export function damageMh(player: Player, amount: number): number {
  const effectiveAmount = Math.floor(amount * player.defenseMultiplier);
  player.mh = Math.max(0, player.mh - effectiveAmount);
  return effectiveAmount;
}

export function consumeDl(player: Player, amount: number): boolean {
  if (player.dl < amount) return false;
  player.dl -= amount;
  return true;
}

export function consumeMh(player: Player, amount: number): boolean {
  if (player.mh <= amount) return false;
  player.mh -= amount;
  return true;
}
