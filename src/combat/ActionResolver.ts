import type { ActionType, GameState, Enemy } from "../game/types.ts";
import { addLog } from "../game/GameState.ts";
import { isAdjacent } from "../entity/Entity.ts";
import { healMh } from "../entity/Player.ts";
import {
  getEffectiveMhCost,
  getEffectiveDlCost,
  getDebugDamage,
  getHotfixDamage,
  getRefactorDefense,
  getRefactorHeal,
} from "./ActionDefinitions.ts";

function findNearestEnemy(state: GameState): Enemy | null {
  const living = state.enemies.filter((e) => e.hp > 0);
  if (living.length === 0) return null;

  // Find adjacent enemy first
  const adjacent = living.find((e) => isAdjacent(e.position, state.player.position));
  if (adjacent) return adjacent;

  // Otherwise nearest
  let nearest: Enemy | null = null;
  let minDist = Infinity;
  for (const e of living) {
    const dist = Math.abs(e.position.x - state.player.position.x) +
      Math.abs(e.position.y - state.player.position.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = e;
    }
  }
  return nearest;
}

function damageEnemy(state: GameState, enemy: Enemy, damage: number): void {
  enemy.hp = Math.max(0, enemy.hp - damage);
  addLog(state, `Hit ${enemy.variant} for ${damage} damage!`);

  if (enemy.hp <= 0) {
    addLog(state, `${enemy.variant} destroyed! +${enemy.xpReward} XP`);
    state.player.xp += enemy.xpReward;
    state.totalXp += enemy.xpReward;
  }
}

export function resolveAction(state: GameState, action: ActionType): boolean {
  switch (action) {
    case "debug":
      return resolveDebug(state);
    case "hotfix":
      return resolveHotfix(state);
    case "google_it":
      return resolveGoogleIt(state);
    case "refactor":
      return resolveRefactor(state);
    default:
      return false;
  }
}

function resolveDebug(state: GameState): boolean {
  const target = findNearestEnemy(state);
  if (!target || !isAdjacent(target.position, state.player.position)) {
    addLog(state, "No adjacent bug to debug.");
    return false;
  }

  const cost = getEffectiveMhCost(state, "debug");
  if (state.player.mh <= cost) {
    addLog(state, "Not enough Mental Health to Debug.");
    return false;
  }

  state.player.mh -= cost;
  const damage = getDebugDamage(state);
  damageEnemy(state, target, damage);
  return true;
}

function resolveHotfix(state: GameState): boolean {
  const target = findNearestEnemy(state);
  if (!target || !isAdjacent(target.position, state.player.position)) {
    addLog(state, "No adjacent bug to hotfix.");
    return false;
  }

  const cost = getEffectiveMhCost(state, "hotfix");
  if (state.player.mh <= cost) {
    addLog(state, "Not enough Mental Health for Hotfix.");
    return false;
  }

  state.player.mh -= cost;
  const damage = getHotfixDamage(state);
  damageEnemy(state, target, damage);
  state.player.stunned = true;
  addLog(state, "Hotfix deployed! Cooldown next turn.");
  return true;
}

function resolveGoogleIt(state: GameState): boolean {
  const cost = getEffectiveDlCost(state, "google_it");
  if (state.player.dl < cost) {
    addLog(state, "Not enough Deadline for Google It.");
    return false;
  }

  state.player.dl -= cost;

  // Reveal all tiles in the current room and show enemy info
  const { dungeon, player } = state;
  let revealed = 0;
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const tile = dungeon.tiles[y]?.[x];
      if (tile && tile.type !== "wall" && tile.type !== "void") {
        const dist = Math.abs(x - player.position.x) + Math.abs(y - player.position.y);
        if (dist <= 15) {
          if (tile.visibility === "hidden") revealed++;
          tile.visibility = "visible";
        }
      }
    }
  }

  // Show enemy info
  for (const enemy of state.enemies) {
    if (enemy.hp > 0) {
      const dist = Math.abs(enemy.position.x - player.position.x) +
        Math.abs(enemy.position.y - player.position.y);
      if (dist <= 15) {
        addLog(state, `[${enemy.variant}] HP: ${enemy.hp}/${enemy.maxHp} ATK: ${enemy.attack}`);
      }
    }
  }

  addLog(state, `Google It: Revealed ${revealed} tiles.`);
  return true;
}

function resolveRefactor(state: GameState): boolean {
  const cost = getEffectiveDlCost(state, "refactor");
  if (state.player.dl < cost) {
    addLog(state, "Not enough Deadline for Refactor.");
    return false;
  }

  state.player.dl -= cost;
  state.player.defending = true;
  state.player.defenseMultiplier = getRefactorDefense(state);

  const healAmount = getRefactorHeal();
  const healed = healMh(state.player, healAmount);

  addLog(state, `Refactor: Defense up! Healed ${healed} MH.`);
  return true;
}
