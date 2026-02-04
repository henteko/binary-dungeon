import type { GameState } from "../game/types.ts";
import { getTileChar } from "../dungeon/Tile.ts";
import { PLAYER_CHAR, DUNGEON_WIDTH, DUNGEON_HEIGHT } from "../game/constants.ts";

const ENEMY_CHARS: Record<string, string> = {
  Segfault: "S",
  NullRef: "N",
  OffByOne: "O",
  RaceCondition: "R",
  MemoryLeak: "M",
  InfiniteLoop: "I",
};

// --- ANSI helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function fgCode(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[38;2;${r};${g};${b}m`;
}

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function moveTo(row: number, col: number): string {
  return `\x1b[${row};${col}H`;
}

// Colors
const C = {
  player: "#FFD700",
  wall: "#666666",
  wallDim: "#333333",
  floor: "#444444",
  floorDim: "#222222",
  stairs: "#00FF00",
  enemy: "#FF4444",
  mhBar: "#44FF44",
  dlBar: "#FFAA00",
  burnout: "#FF0000",
  title: "#00AAFF",
  log: "#CCCCCC",
  text: "#E0E0E0",
  textSec: "#888888",
  muted: "#555555",
  border: "#333333",
};

// Layout constants
const MAP_W = DUNGEON_WIDTH;   // 50
const MAP_H = DUNGEON_HEIGHT;  // 20
const STATUS_W = 28;
// Total inner width = MAP_W + 1(divider) + STATUS_W = 79
// Total outer width = 1(left) + MAP_W + 1(divider) + STATUS_W + 1(right) = 81
const TOTAL_W = MAP_W + STATUS_W + 1; // inner width for horizontal lines

// Box drawing characters (single line)
const BOX = {
  tl: "╭", tr: "╮", bl: "╰", br: "╯",    // rounded for header
  stl: "┌", str: "┐", sbl: "└", sbr: "┘", // single for body
  h: "─", v: "│",
  td: "┬", tu: "┴", tl2: "├", tr2: "┤",
};

function hLine(width: number): string {
  return BOX.h.repeat(width);
}

function formatTurnEvents(state: GameState): [string, string][] {
  const events = state.turnEvents;
  const lines: [string, string][] = [];

  for (const ev of events) {
    switch (ev.kind) {
      case "action":
        lines.push([`${BOLD}${fgCode(C.title)}`, `> ${ev.label}`]);
        break;
      case "damage_dealt":
        lines.push([
          `${fgCode(C.mhBar)}`,
          ev.killed
            ? `  -> ${ev.target} -${ev.amount} KILLED!`
            : `  -> ${ev.target} -${ev.amount}`,
        ]);
        break;
      case "damage_taken":
        lines.push([`${fgCode(C.enemy)}`, `  <- ${ev.source} -${ev.amount} MH`]);
        break;
      case "heal":
        lines.push([`${fgCode(C.mhBar)}`, `  +${ev.amount} MH healed`]);
        break;
      case "move":
        lines.push([`${fgCode(C.text)}`, `> Move ${ev.direction}`]);
        break;
      case "wait":
        lines.push([`${fgCode(C.muted)}`, `> Wait...`]);
        break;
      case "stunned":
        lines.push([`${fgCode(C.dlBar)}`, `> Stunned (cooldown)`]);
        break;
      case "burnout_tick":
        lines.push([`${fgCode(C.burnout)}`, `  BURNOUT -${ev.amount} MH`]);
        break;
    }
  }

  // Pad to exactly 3 lines for consistent layout
  while (lines.length < 3) {
    lines.push([`${fgCode(C.muted)}`, ""]);
  }
  return lines.slice(0, 3);
}

export function renderSnapshot(state: GameState): string {
  const { dungeon, player, enemies, milestone, turnCount, burnoutMode, log } = state;
  const bc = `${fgCode(C.border)}`; // border color

  let r = 1; // current row
  let out = "\x1b[2J"; // clear screen

  // ===== Row 1: Header top border (rounded) =====
  out += moveTo(r, 1);
  out += `${bc}${BOX.tl}${hLine(TOTAL_W)}${BOX.tr}${RESET}`;
  r++;

  // ===== Row 2: Header content =====
  out += moveTo(r, 1);
  out += `${bc}${BOX.v}${RESET}`;
  out += ` ${BOLD}${fgCode(C.title)}[ BINARY DUNGEON ]${RESET}`;
  // Milestone at right side
  const msText = `[ MILESTONE: ${milestone.version} ]`;
  const burnoutText = burnoutMode ? " !! BURNOUT !!" : "";
  const msColor = burnoutMode ? C.burnout : C.title;
  const rightContent = `${BOLD}${fgCode(msColor)}${msText}${burnoutText}${RESET}`;
  // Position milestone: total_w + 1 (left border) - len(msText+burnoutText) - 1 (padding)
  const msVisibleLen = msText.length + burnoutText.length;
  const msCol = TOTAL_W + 2 - msVisibleLen;
  out += moveTo(r, msCol);
  out += rightContent;
  out += moveTo(r, TOTAL_W + 2);
  out += `${bc}${BOX.v}${RESET}`;
  r++;

  // ===== Row 3: Header bottom border =====
  out += moveTo(r, 1);
  out += `${bc}${BOX.bl}${hLine(TOTAL_W)}${BOX.br}${RESET}`;
  r++;

  // ===== Row 4: Body top border =====
  out += moveTo(r, 1);
  out += `${bc}${BOX.stl}${hLine(MAP_W)}${BOX.td}${hLine(STATUS_W)}${BOX.str}${RESET}`;
  r++;

  const bodyStartRow = r;

  // ===== Rows 5..5+MAP_H-1: Dungeon map + Status =====
  for (let y = 0; y < MAP_H; y++) {
    const row = bodyStartRow + y;

    // Left border
    out += moveTo(row, 1);
    out += `${bc}${BOX.v}${RESET}`;

    // Map cells
    for (let x = 0; x < MAP_W; x++) {
      out += renderCell(state, x, y);
    }
    out += RESET;

    // Middle divider
    out += moveTo(row, 1 + MAP_W + 1);
    out += `${bc}${BOX.v}${RESET}`;

    // Right border
    out += moveTo(row, TOTAL_W + 2);
    out += `${bc}${BOX.v}${RESET}`;
  }

  // ===== Status panel content (positioned at right column) =====
  const statusCol = 1 + MAP_W + 2; // after left border + map + divider + 1 padding

  const title = state.scriptKiddie ? "Script Kiddie" : state.title;
  const verified = state.scriptKiddie ? "" : " (Verified)";
  const livingEnemies = enemies.filter((e) => e.hp > 0).length;

  const mhBarLen = 10;
  const mhFilled = Math.round((player.mh / player.maxMh) * mhBarLen);
  const mhBarStr = "#".repeat(mhFilled) + "-".repeat(mhBarLen - mhFilled);
  const mhColor = burnoutMode ? C.burnout : C.mhBar;

  const dlBarLen = 10;
  const dlFilled = Math.round((player.dl / player.maxDl) * dlBarLen);
  const dlBarStr = "|".repeat(dlFilled) + " ".repeat(dlBarLen - dlFilled);
  const dlColor = burnoutMode ? C.burnout : C.dlBar;

  // Format turn events (up to 3 lines)
  const eventLines = formatTurnEvents(state);

  const statusEntries: ([string, string] | null)[] = [
    [`${fgCode(C.text)}`, `Player: ${player.name}`],
    [`${fgCode(C.text)}`, `Rank:   ${title}${verified}`],
    [`${fgCode(C.text)}`, `Bugs:   ${livingEnemies} remaining`],
    null,
    [`${BOLD}${fgCode(C.textSec)}`, "[ RESOURCES ]"],
    [`${fgCode(mhColor)}`, `MH: [${mhBarStr}] ${String(player.mh).padStart(3)}/${player.maxMh}`],
    [`${fgCode(dlColor)}`, `DL: [${dlBarStr}] ${String(player.dl).padStart(3)}/${player.maxDl}`],
    null,
    [`${BOLD}${fgCode(C.textSec)}`, "[ TECH STACKS ]"],
    [`${fgCode(C.text)}`, `Py:${state.techStacks.python} C++:${state.techStacks.cpp} Rs:${state.techStacks.rust} Go:${state.techStacks.go}`],
    null,
    [`${BOLD}${fgCode(C.textSec)}`, "[ LAST ACTION ]"],
    ...eventLines.map((line): [string, string] => [line[0], line[1]]),
    null,
    [`${fgCode(C.muted)}`, `Turn: ${turnCount}`],
  ];

  for (let i = 0; i < statusEntries.length && i < MAP_H; i++) {
    const entry = statusEntries[i];
    if (!entry) continue;
    const [color, text] = entry;
    out += moveTo(bodyStartRow + i, statusCol);
    out += `${color}${text}${RESET}`;
  }

  r = bodyStartRow + MAP_H;

  // ===== Body-Log divider =====
  out += moveTo(r, 1);
  out += `${bc}${BOX.tl2}${hLine(MAP_W)}${BOX.tu}${hLine(STATUS_W)}${BOX.tr2}${RESET}`;
  r++;

  // ===== Log panel =====
  out += moveTo(r, 1);
  out += `${bc}${BOX.v}${RESET}`;
  out += ` ${BOLD}${fgCode(C.textSec)}[ LOG ]${RESET}`;
  out += moveTo(r, TOTAL_W + 2);
  out += `${bc}${BOX.v}${RESET}`;
  r++;

  const recentLog = log.slice(-3);
  for (let i = 0; i < 3; i++) {
    out += moveTo(r, 1);
    out += `${bc}${BOX.v}${RESET}`;
    if (recentLog[i]) {
      out += ` ${fgCode(C.log)}> ${recentLog[i]}${RESET}`;
    }
    out += moveTo(r, TOTAL_W + 2);
    out += `${bc}${BOX.v}${RESET}`;
    r++;
  }

  // ===== Log bottom border =====
  out += moveTo(r, 1);
  out += `${bc}${BOX.sbl}${hLine(TOTAL_W)}${BOX.sbr}${RESET}`;

  return out;
}

function renderCell(state: GameState, x: number, y: number): string {
  const { dungeon, player, enemies } = state;

  if (player.position.x === x && player.position.y === y) {
    return `${BOLD}${fgCode(C.player)}${PLAYER_CHAR}`;
  }

  const enemy = enemies.find(
    (e) => e.hp > 0 && e.position.x === x && e.position.y === y
  );
  if (enemy) {
    const tile = dungeon.tiles[y]?.[x];
    if (tile && tile.visibility === "visible") {
      return `${BOLD}${fgCode(C.enemy)}${ENEMY_CHARS[enemy.variant] ?? "?"}`;
    }
  }

  const tile = dungeon.tiles[y]?.[x];
  if (!tile || tile.visibility === "hidden") {
    return " ";
  }

  const ch = getTileChar(tile.type);
  const isExplored = tile.visibility === "explored";

  if (tile.type === "stairs") {
    return `${BOLD}${fgCode(C.stairs)}${ch}`;
  }
  if (tile.type === "wall") {
    return isExplored ? `${DIM}${fgCode(C.wallDim)}${ch}` : `${fgCode(C.wall)}${ch}`;
  }
  return isExplored ? `${DIM}${fgCode(C.floorDim)}${ch}` : `${fgCode(C.floor)}${ch}`;
}
