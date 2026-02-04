export const GAME_TITLE = "BINARY DUNGEON";

export const DUNGEON_WIDTH = 50;
export const DUNGEON_HEIGHT = 20;

export const INITIAL_MH = 80;
export const INITIAL_DL = 50;

export const DL_DECAY_PER_TURN = 1;
export const BURNOUT_DAMAGE_PER_TURN = 2;
export const BURNOUT_ENEMY_MULTIPLIER = 1.5;

export const ACTION_COSTS = {
  debug: { mh: 5, dl: 0 },
  hotfix: { mh: 15, dl: 0 },
  google_it: { mh: 0, dl: 5 },
  refactor: { mh: 0, dl: 3 },
} as const;

export const ACTION_POWER = {
  debug: 10,
  hotfix: 30,
  refactor_defense: 0.5,
  refactor_heal: 5,
  google_it_reveal: true,
} as const;

export const FOV_RADIUS = 8;

export const BSP_MIN_ROOM_SIZE = 4;
export const BSP_MAX_ROOM_SIZE = 10;
export const BSP_SPLIT_DEPTH = 5;

export const MILESTONES = [
  { version: "v1.0.0", floor: 1, enemyCount: 3, enemyHpMult: 1.0, enemyAtkMult: 1.0, dlBonus: 0 },
  { version: "v1.1.0", floor: 2, enemyCount: 4, enemyHpMult: 1.2, enemyAtkMult: 1.1, dlBonus: 5 },
  { version: "v1.2.0", floor: 3, enemyCount: 5, enemyHpMult: 1.4, enemyAtkMult: 1.2, dlBonus: 10 },
  { version: "v1.3.0", floor: 4, enemyCount: 6, enemyHpMult: 1.7, enemyAtkMult: 1.3, dlBonus: 10 },
  { version: "v2.0.0", floor: 5, enemyCount: 7, enemyHpMult: 2.0, enemyAtkMult: 1.5, dlBonus: 15 },
  { version: "v2.1.0", floor: 6, enemyCount: 8, enemyHpMult: 2.3, enemyAtkMult: 1.7, dlBonus: 15 },
  { version: "v3.0.0", floor: 7, enemyCount: 10, enemyHpMult: 2.8, enemyAtkMult: 2.0, dlBonus: 20 },
] as const;

export const ENEMY_BASE_STATS: Record<string, { hp: number; attack: number; xp: number }> = {
  Segfault: { hp: 15, attack: 8, xp: 10 },
  NullRef: { hp: 10, attack: 5, xp: 7 },
  OffByOne: { hp: 8, attack: 3, xp: 5 },
  RaceCondition: { hp: 20, attack: 10, xp: 15 },
  MemoryLeak: { hp: 25, attack: 6, xp: 12 },
  InfiniteLoop: { hp: 12, attack: 7, xp: 8 },
};

export const TECH_STACK_EFFECTS = {
  python: { mhCostReduction: 0.1 },
  cpp: { hotfixPowerBonus: 0.15 },
  rust: { defenseBonus: 0.1 },
  go: { dlCostReduction: 0.1 },
} as const;

export const XP_PER_LEVEL = 50;
export const MAX_STACK_LEVEL = 10;

export const TITLES = ["Junior", "Mid-level", "Senior", "Lead", "Architect"] as const;
export type Title = (typeof TITLES)[number];

export const ITEM_CHARS: Record<string, string> = {
  coffee: "c",
  pizza: "p",
  red_bull: "r",
  mech_keyboard: "K",
  nc_headphones: "H",
  sudo: "$",
};

export const ITEM_COLORS: Record<string, string> = {
  coffee: "#8B4513",
  pizza: "#FFA500",
  red_bull: "#00BFFF",
  mech_keyboard: "#FF69B4",
  nc_headphones: "#9370DB",
  sudo: "#00FF00",
};

export const ITEM_NAMES: Record<string, string> = {
  coffee: "Coffee",
  pizza: "Pizza",
  red_bull: "Red Bull",
  mech_keyboard: "Mech Keyboard",
  nc_headphones: "NC Headphones",
  sudo: "sudo",
};

export const ITEM_EFFECTS: Record<string, { type: "heal" | "heal_and_buff" | "buff" | "sudo"; heal?: number; buffType?: "attackUp" | "defenseUp" | "sudo"; duration?: number; multiplier?: number; crashDamage?: number }> = {
  coffee: { type: "heal", heal: 15 },
  pizza: { type: "heal", heal: 35 },
  red_bull: { type: "heal_and_buff", heal: 20, buffType: "attackUp", duration: 5, multiplier: 1.5, crashDamage: 10 },
  mech_keyboard: { type: "buff", buffType: "attackUp", duration: 6, multiplier: 1.4 },
  nc_headphones: { type: "buff", buffType: "defenseUp", duration: 6, multiplier: 0.4 },
  sudo: { type: "sudo", buffType: "sudo", duration: 999, multiplier: 3.0 },
};

export const ITEM_SPAWN_COUNTS = [2, 2, 3, 3, 4, 4, 5];

export const ITEM_WEIGHTS: Record<string, number> = {
  coffee: 30,
  pizza: 15,
  red_bull: 10,
  mech_keyboard: 15,
  nc_headphones: 15,
  sudo: 5,
};

export const PLAYER_CHAR = "@";
export const WALL_CHAR = "#";
export const FLOOR_CHAR = ".";
export const STAIRS_CHAR = ">";
export const VOID_CHAR = " ";

export const COLORS = {
  player: "#FFD700",
  wall: "#666666",
  wallExplored: "#333333",
  floor: "#444444",
  floorExplored: "#222222",
  stairs: "#00FF00",
  enemy: "#FF4444",
  mhBar: "#44FF44",
  dlBar: "#FFAA00",
  burnout: "#FF0000",
  title: "#00AAFF",
  log: "#CCCCCC",
  background: "#0a0a0a",
  panelBorder: "#333333",
  panelBorderFocused: "#00AAFF",
  textPrimary: "#E0E0E0",
  textSecondary: "#888888",
  textMuted: "#555555",
} as const;
