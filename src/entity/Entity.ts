import type { Position, EntityBase } from "../game/types.ts";

export function distanceBetween(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isAdjacent(a: Position, b: Position): boolean {
  return distanceBetween(a, b) === 1;
}

export function positionEquals(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}
