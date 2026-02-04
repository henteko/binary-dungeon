import type { DungeonMap, Position, TileState } from "../game/types.ts";
import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  BSP_MIN_ROOM_SIZE,
  BSP_SPLIT_DEPTH,
} from "../game/constants.ts";

type Rect = { x: number; y: number; w: number; h: number };

type BSPNode = {
  rect: Rect;
  room: Rect | null;
  left: BSPNode | null;
  right: BSPNode | null;
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function splitNode(node: BSPNode, depth: number): void {
  if (depth <= 0) return;

  const { rect } = node;
  const canSplitH = rect.h >= BSP_MIN_ROOM_SIZE * 2 + 2;
  const canSplitV = rect.w >= BSP_MIN_ROOM_SIZE * 2 + 2;

  if (!canSplitH && !canSplitV) return;

  let splitHorizontally: boolean;
  if (canSplitH && canSplitV) {
    splitHorizontally = rect.h > rect.w ? true : rect.w > rect.h ? false : Math.random() > 0.5;
  } else {
    splitHorizontally = canSplitH;
  }

  if (splitHorizontally) {
    const minSplit = rect.y + BSP_MIN_ROOM_SIZE + 1;
    const maxSplit = rect.y + rect.h - BSP_MIN_ROOM_SIZE - 1;
    if (minSplit >= maxSplit) return;
    const split = randomInt(minSplit, maxSplit);
    node.left = {
      rect: { x: rect.x, y: rect.y, w: rect.w, h: split - rect.y },
      room: null,
      left: null,
      right: null,
    };
    node.right = {
      rect: { x: rect.x, y: split, w: rect.w, h: rect.y + rect.h - split },
      room: null,
      left: null,
      right: null,
    };
  } else {
    const minSplit = rect.x + BSP_MIN_ROOM_SIZE + 1;
    const maxSplit = rect.x + rect.w - BSP_MIN_ROOM_SIZE - 1;
    if (minSplit >= maxSplit) return;
    const split = randomInt(minSplit, maxSplit);
    node.left = {
      rect: { x: rect.x, y: rect.y, w: split - rect.x, h: rect.h },
      room: null,
      left: null,
      right: null,
    };
    node.right = {
      rect: { x: split, y: rect.y, w: rect.x + rect.w - split, h: rect.h },
      room: null,
      left: null,
      right: null,
    };
  }

  splitNode(node.left, depth - 1);
  splitNode(node.right, depth - 1);
}

function createRoom(node: BSPNode): void {
  if (node.left && node.right) {
    createRoom(node.left);
    createRoom(node.right);
    return;
  }

  const { rect } = node;
  const roomW = randomInt(BSP_MIN_ROOM_SIZE, Math.min(rect.w - 2, 10));
  const roomH = randomInt(BSP_MIN_ROOM_SIZE, Math.min(rect.h - 2, 8));
  const roomX = randomInt(rect.x + 1, rect.x + rect.w - roomW - 1);
  const roomY = randomInt(rect.y + 1, rect.y + rect.h - roomH - 1);

  node.room = { x: roomX, y: roomY, w: roomW, h: roomH };
}

function getRoomCenter(room: Rect): Position {
  return {
    x: Math.floor(room.x + room.w / 2),
    y: Math.floor(room.y + room.h / 2),
  };
}

function getLeafRoom(node: BSPNode): Rect | null {
  if (node.room) return node.room;
  if (node.left) {
    const r = getLeafRoom(node.left);
    if (r) return r;
  }
  if (node.right) {
    const r = getLeafRoom(node.right);
    if (r) return r;
  }
  return null;
}

function carveCorridor(tiles: TileState[][], from: Position, to: Position): void {
  let { x, y } = from;

  while (x !== to.x) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < (tiles[0]?.length ?? 0)) {
      const tile = tiles[y]?.[x];
      if (tile) tile.type = "floor";
    }
    x += x < to.x ? 1 : -1;
  }
  while (y !== to.y) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < (tiles[0]?.length ?? 0)) {
      const tile = tiles[y]?.[x];
      if (tile) tile.type = "floor";
    }
    y += y < to.y ? 1 : -1;
  }
}

function connectRooms(node: BSPNode, tiles: TileState[][]): void {
  if (!node.left || !node.right) return;

  connectRooms(node.left, tiles);
  connectRooms(node.right, tiles);

  const leftRoom = getLeafRoom(node.left);
  const rightRoom = getLeafRoom(node.right);

  if (leftRoom && rightRoom) {
    const from = getRoomCenter(leftRoom);
    const to = getRoomCenter(rightRoom);
    carveCorridor(tiles, from, to);
  }
}

function collectRooms(node: BSPNode, rooms: Rect[]): void {
  if (node.room) {
    rooms.push(node.room);
  }
  if (node.left) collectRooms(node.left, rooms);
  if (node.right) collectRooms(node.right, rooms);
}

export type GeneratedDungeon = {
  dungeon: DungeonMap;
  playerStart: Position;
  stairsPosition: Position;
  rooms: Rect[];
};

export function generateDungeon(): GeneratedDungeon {
  const tiles: TileState[][] = Array.from({ length: DUNGEON_HEIGHT }, () =>
    Array.from({ length: DUNGEON_WIDTH }, () => ({
      type: "wall" as const,
      visibility: "hidden" as const,
    }))
  );

  const root: BSPNode = {
    rect: { x: 0, y: 0, w: DUNGEON_WIDTH, h: DUNGEON_HEIGHT },
    room: null,
    left: null,
    right: null,
  };

  splitNode(root, BSP_SPLIT_DEPTH);
  createRoom(root);
  connectRooms(root, tiles);

  // Carve rooms into tiles
  const rooms: Rect[] = [];
  collectRooms(root, rooms);

  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
          const tile = tiles[y]?.[x];
          if (tile) tile.type = "floor";
        }
      }
    }
  }

  // Place player in first room, stairs in last room
  const firstRoom = rooms[0];
  const lastRoom = rooms[rooms.length - 1];

  const playerStart = firstRoom
    ? getRoomCenter(firstRoom)
    : { x: 1, y: 1 };

  const stairsPosition = lastRoom
    ? getRoomCenter(lastRoom)
    : { x: DUNGEON_WIDTH - 2, y: DUNGEON_HEIGHT - 2 };

  const stairsTile = tiles[stairsPosition.y]?.[stairsPosition.x];
  if (stairsTile) stairsTile.type = "stairs";

  return {
    dungeon: { width: DUNGEON_WIDTH, height: DUNGEON_HEIGHT, tiles },
    playerStart,
    stairsPosition,
    rooms,
  };
}
