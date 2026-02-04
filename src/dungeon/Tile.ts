import type { TileType } from "../game/types.ts";
import {
  PLAYER_CHAR,
  WALL_CHAR,
  FLOOR_CHAR,
  STAIRS_CHAR,
  VOID_CHAR,
  COLORS,
} from "../game/constants.ts";

export function getTileChar(type: TileType): string {
  switch (type) {
    case "floor":
      return FLOOR_CHAR;
    case "wall":
      return WALL_CHAR;
    case "stairs":
      return STAIRS_CHAR;
    case "void":
      return VOID_CHAR;
  }
}

export function getTileColor(type: TileType, explored: boolean): string {
  if (explored) {
    switch (type) {
      case "floor":
        return COLORS.floorExplored;
      case "wall":
        return COLORS.wallExplored;
      case "stairs":
        return COLORS.stairs;
      default:
        return COLORS.background;
    }
  }
  switch (type) {
    case "floor":
      return COLORS.floor;
    case "wall":
      return COLORS.wall;
    case "stairs":
      return COLORS.stairs;
    default:
      return COLORS.background;
  }
}

export { PLAYER_CHAR };
