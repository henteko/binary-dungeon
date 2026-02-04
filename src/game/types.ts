export type Position = {
  x: number;
  y: number;
};

export type TileType = "floor" | "wall" | "stairs" | "void";

export type ItemVariant = "coffee" | "pizza" | "red_bull" | "mech_keyboard" | "nc_headphones" | "sudo";

export type Item = {
  id: string;
  variant: ItemVariant;
  position: Position;
  pickedUp: boolean;
};

export type BuffType = "attackUp" | "defenseUp" | "sudo";

export type ActiveBuff = {
  type: BuffType;
  source: ItemVariant;
  turnsRemaining: number;
  multiplier: number;
};

export type Visibility = "visible" | "explored" | "hidden";

export type TileState = {
  type: TileType;
  visibility: Visibility;
};

export type DungeonMap = {
  width: number;
  height: number;
  tiles: TileState[][];
};

export type EntityType = "player" | "enemy";

export type EntityBase = {
  id: string;
  type: EntityType;
  position: Position;
  name: string;
};

export type EnemyVariant =
  | "Segfault"
  | "NullRef"
  | "OffByOne"
  | "RaceCondition"
  | "MemoryLeak"
  | "InfiniteLoop";

export type Enemy = EntityBase & {
  type: "enemy";
  variant: EnemyVariant;
  hp: number;
  maxHp: number;
  attack: number;
  xpReward: number;
  stunned: boolean;
};

export type Player = EntityBase & {
  type: "player";
  mh: number;
  maxMh: number;
  dl: number;
  maxDl: number;
  xp: number;
  stunned: boolean;
  defending: boolean;
  defenseMultiplier: number;
};

export type ActionType = "debug" | "hotfix" | "google_it" | "refactor";

export type TechStackType = "python" | "cpp" | "rust" | "go";

export type TechStacks = Record<TechStackType, number>;

export type Milestone = {
  version: string;
  floor: number;
};

export type GamePhase = "title" | "exploring" | "combat" | "game_over" | "xp_invest";

export type TurnEvent =
  | { kind: "action"; label: string }
  | { kind: "damage_dealt"; target: string; amount: number; killed: boolean }
  | { kind: "damage_taken"; source: string; amount: number }
  | { kind: "heal"; amount: number }
  | { kind: "move"; direction: string }
  | { kind: "wait" }
  | { kind: "stunned" }
  | { kind: "burnout_tick"; amount: number }
  | { kind: "item_pickup"; item: ItemVariant; effect: string }
  | { kind: "buff_expired"; buff: BuffType; source: ItemVariant; crash?: number };

export type GameState = {
  phase: GamePhase;
  player: Player;
  enemies: Enemy[];
  dungeon: DungeonMap;
  milestone: Milestone;
  turnCount: number;
  burnoutMode: boolean;
  log: string[];
  techStacks: TechStacks;
  totalXp: number;
  title: string;
  scriptKiddie: boolean;
  turnEvents: TurnEvent[];
  items: Item[];
  activeBuffs: ActiveBuff[];
};
