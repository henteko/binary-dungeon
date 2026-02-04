import type { DungeonMap, Position } from "../game/types.ts";
import { FOV_RADIUS } from "../game/constants.ts";

type OctantTransform = [number, number, number, number];

const OCTANT_TRANSFORMS: OctantTransform[] = [
  [1, 0, 0, 1],
  [0, 1, 1, 0],
  [0, -1, 1, 0],
  [-1, 0, 0, 1],
  [-1, 0, 0, -1],
  [0, -1, -1, 0],
  [0, 1, -1, 0],
  [1, 0, 0, -1],
];

function isOpaque(dungeon: DungeonMap, x: number, y: number): boolean {
  if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) return true;
  const tile = dungeon.tiles[y]?.[x];
  return !tile || tile.type === "wall" || tile.type === "void";
}

function setVisible(dungeon: DungeonMap, x: number, y: number): void {
  if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) return;
  const tile = dungeon.tiles[y]?.[x];
  if (tile) tile.visibility = "visible";
}

function castShadow(
  dungeon: DungeonMap,
  origin: Position,
  transform: OctantTransform,
  row: number,
  startSlope: number,
  endSlope: number,
  radius: number
): void {
  if (startSlope < endSlope) return;

  let nextStartSlope = startSlope;

  for (let i = row; i <= radius; i++) {
    let blocked = false;

    for (let dx = -i; dx <= 0; dx++) {
      const dy = -i;

      const mapX = origin.x + dx * transform[0] + dy * transform[1];
      const mapY = origin.y + dx * transform[2] + dy * transform[3];

      const leftSlope = (dx - 0.5) / (dy + 0.5);
      const rightSlope = (dx + 0.5) / (dy - 0.5);

      if (nextStartSlope < rightSlope) continue;
      if (endSlope > leftSlope) break;

      const distSq = dx * dx + dy * dy;
      if (distSq <= radius * radius) {
        setVisible(dungeon, mapX, mapY);
      }

      if (blocked) {
        if (isOpaque(dungeon, mapX, mapY)) {
          nextStartSlope = rightSlope;
          continue;
        } else {
          blocked = false;
          nextStartSlope = nextStartSlope;
        }
      } else {
        if (isOpaque(dungeon, mapX, mapY) && i < radius) {
          blocked = true;
          castShadow(
            dungeon,
            origin,
            transform,
            i + 1,
            nextStartSlope,
            leftSlope,
            radius
          );
          nextStartSlope = rightSlope;
        }
      }
    }

    if (blocked) break;
  }
}

export function computeFOV(dungeon: DungeonMap, origin: Position, radius: number = FOV_RADIUS): void {
  // Mark all currently visible tiles as explored (but not visible)
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const tile = dungeon.tiles[y]?.[x];
      if (tile && tile.visibility === "visible") {
        tile.visibility = "explored";
      }
    }
  }

  // Origin is always visible
  setVisible(dungeon, origin.x, origin.y);

  // Cast shadows in all 8 octants
  for (const transform of OCTANT_TRANSFORMS) {
    castShadow(dungeon, origin, transform, 1, 1.0, 0.0, radius);
  }
}
