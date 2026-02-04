import type { Enemy, EnemyVariant, Position } from "../game/types.ts";
import { ENEMY_BASE_STATS, BURNOUT_ENEMY_MULTIPLIER } from "../game/constants.ts";

let enemyIdCounter = 0;

export function createEnemy(variant: EnemyVariant, position: Position, hpMult: number = 1.0, atkMult: number = 1.0): Enemy {
  const base = ENEMY_BASE_STATS[variant] ?? { hp: 10, attack: 5, xp: 5 };
  const hp = Math.floor(base.hp * hpMult);
  return {
    id: `enemy_${enemyIdCounter++}`,
    type: "enemy",
    position: { ...position },
    name: variant,
    variant,
    hp,
    maxHp: hp,
    attack: Math.floor(base.attack * atkMult),
    xpReward: base.xp,
    stunned: false,
  };
}

export function getEnemyAttackDamage(enemy: Enemy, burnoutMode: boolean): number {
  const base = enemy.attack;
  return burnoutMode ? Math.floor(base * BURNOUT_ENEMY_MULTIPLIER) : base;
}

const ENEMY_VARIANTS: EnemyVariant[] = [
  "Segfault",
  "NullRef",
  "OffByOne",
  "RaceCondition",
  "MemoryLeak",
  "InfiniteLoop",
];

export function randomEnemyVariant(): EnemyVariant {
  return ENEMY_VARIANTS[Math.floor(Math.random() * ENEMY_VARIANTS.length)] ?? "NullRef";
}
