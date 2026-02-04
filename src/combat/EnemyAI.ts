import type { GameState, Enemy, Position } from "../game/types.ts";
import { addLog } from "../game/GameState.ts";
import { isAdjacent } from "../entity/Entity.ts";
import { damageMh } from "../entity/Player.ts";
import { getEnemyAttackDamage } from "../entity/Enemy.ts";

function canMoveTo(state: GameState, x: number, y: number, excludeEnemyId: string): boolean {
  if (x < 0 || x >= state.dungeon.width || y < 0 || y >= state.dungeon.height) return false;
  const tile = state.dungeon.tiles[y]?.[x];
  if (!tile || tile.type === "wall" || tile.type === "void") return false;
  if (state.player.position.x === x && state.player.position.y === y) return false;
  // Don't move onto other enemies
  if (state.enemies.some((e) => e.id !== excludeEnemyId && e.hp > 0 && e.position.x === x && e.position.y === y)) return false;
  return true;
}

function moveToward(state: GameState, enemy: Enemy, target: Position): void {
  const dx = target.x - enemy.position.x;
  const dy = target.y - enemy.position.y;

  // Try to move in the direction of largest delta first
  const moves: Position[] = [];
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
    if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
  } else {
    if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
    if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
  }

  for (const move of moves) {
    const newX = enemy.position.x + move.x;
    const newY = enemy.position.y + move.y;
    if (canMoveTo(state, newX, newY, enemy.id)) {
      enemy.position.x = newX;
      enemy.position.y = newY;
      return;
    }
  }
}

export function processEnemyTurns(state: GameState): void {
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.stunned) {
      enemy.stunned = false;
      continue;
    }

    const dist = Math.abs(enemy.position.x - state.player.position.x) +
      Math.abs(enemy.position.y - state.player.position.y);

    // Only act if within detection range
    if (dist > 10) continue;

    if (isAdjacent(enemy.position, state.player.position)) {
      // Attack player
      const damage = getEnemyAttackDamage(enemy, state.burnoutMode);
      const dealt = damageMh(state.player, damage);
      addLog(state, `${enemy.variant} attacks! -${dealt} MH`);
    } else {
      // Chase player
      moveToward(state, enemy, state.player.position);
    }
  }
}
