import {
  FrameBufferRenderable,
  RGBA,
  TextAttributes,
  type CliRenderer,
} from "@opentui/core";
import type { GameState, Enemy } from "../../game/types.ts";
import { getTileChar, getTileColor, PLAYER_CHAR } from "../../dungeon/Tile.ts";
import { COLORS } from "../../game/constants.ts";

const ENEMY_CHARS: Record<string, string> = {
  Segfault: "S",
  NullRef: "N",
  OffByOne: "O",
  RaceCondition: "R",
  MemoryLeak: "M",
  InfiniteLoop: "I",
};

export class DungeonView {
  private fb: FrameBufferRenderable;
  private renderer: CliRenderer;

  constructor(renderer: CliRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.fb = new FrameBufferRenderable(renderer, {
      id: "dungeon-fb",
      width,
      height,
    });
  }

  getRenderable(): FrameBufferRenderable {
    return this.fb;
  }

  render(state: GameState): void {
    const buffer = this.fb.frameBuffer;
    const { dungeon, player, enemies } = state;

    buffer.clear(RGBA.fromHex(COLORS.background));

    // Draw tiles
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.tiles[y]?.[x];
        if (!tile) continue;

        if (tile.visibility === "hidden") continue;

        const isExplored = tile.visibility === "explored";
        const char = getTileChar(tile.type);
        const color = getTileColor(tile.type, isExplored);
        const fg = RGBA.fromHex(color);

        if (isExplored) {
          buffer.setCell(x, y, char, fg, RGBA.fromHex(COLORS.background), TextAttributes.DIM);
        } else {
          buffer.setCell(x, y, char, fg, RGBA.fromHex(COLORS.background), TextAttributes.NONE);
        }
      }
    }

    // Draw enemies (only if visible)
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const tile = dungeon.tiles[enemy.position.y]?.[enemy.position.x];
      if (!tile || tile.visibility !== "visible") continue;

      const char = ENEMY_CHARS[enemy.variant] ?? "?";
      buffer.setCell(
        enemy.position.x,
        enemy.position.y,
        char,
        RGBA.fromHex(COLORS.enemy),
        RGBA.fromHex(COLORS.background),
        TextAttributes.BOLD
      );
    }

    // Draw player
    buffer.setCell(
      player.position.x,
      player.position.y,
      PLAYER_CHAR,
      RGBA.fromHex(COLORS.player),
      RGBA.fromHex(COLORS.background),
      TextAttributes.BOLD
    );
  }

  resize(width: number, height: number): void {
    this.fb.frameBuffer.resize(width, height);
  }
}
