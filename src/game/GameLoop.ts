import type { GameState, ActionType, Position, TechStackType } from "./types.ts";
import { addLog, createInitialGameState } from "./GameState.ts";
import { computeFOV } from "../dungeon/FOV.ts";
import { generateDungeon } from "../dungeon/DungeonGenerator.ts";
import { resolveAction } from "../combat/ActionResolver.ts";
import { processEnemyTurns } from "../combat/EnemyAI.ts";
import { createEnemy, randomEnemyVariant } from "../entity/Enemy.ts";
import { canUpgrade, upgradeStack, getUpgradeCost } from "../progression/TechStack.ts";
import { getAvailableXp, updateTitle } from "../progression/XPManager.ts";
import {
  DL_DECAY_PER_TURN,
  BURNOUT_DAMAGE_PER_TURN,
  INITIAL_DL,
  MILESTONES,
} from "./constants.ts";

export type GameEvent =
  | { type: "move"; direction: Position }
  | { type: "action"; action: ActionType }
  | { type: "wait" }
  | { type: "start_game" }
  | { type: "next_milestone" }
  | { type: "invest_xp"; stack: import("./types.ts").TechStackType }
  | { type: "finish_invest" }
  | { type: "new_game" };

export function processTurn(state: GameState, event: GameEvent): void {
  state.turnEvents = [];

  if (state.phase === "title") {
    if (event.type === "start_game") {
      state.phase = "exploring";
      addLog(state, "Starting Milestone " + state.milestone.version + "...");
      spawnEnemies(state);
      computeFOV(state.dungeon, state.player.position);
    }
    return;
  }

  if (state.phase === "game_over") {
    if (event.type === "start_game") {
      state.phase = "xp_invest";
      addLog(state, "Invest your XP in Tech Stacks!");
    }
    return;
  }

  if (state.phase === "xp_invest") {
    if (event.type === "invest_xp") {
      handleXpInvest(state, event.stack);
    } else if (event.type === "finish_invest") {
      handleNewGame(state);
    }
    return;
  }

  if (state.player.stunned) {
    state.player.stunned = false;
    state.turnEvents.push({ kind: "stunned" });
    addLog(state, "You recover from the Hotfix cooldown.");
    processEnemyTurns(state);
    endOfTurn(state);
    return;
  }

  let acted = false;

  switch (event.type) {
    case "move":
      acted = handleMove(state, event.direction);
      break;
    case "action":
      acted = resolveAction(state, event.action);
      break;
    case "wait":
      state.turnEvents.push({ kind: "wait" });
      addLog(state, "You wait...");
      acted = true;
      break;
  }

  if (acted) {
    processEnemyTurns(state);
    computeFOV(state.dungeon, state.player.position);
    endOfTurn(state);
  }
}

function handleMove(state: GameState, direction: Position): boolean {
  const newX = state.player.position.x + direction.x;
  const newY = state.player.position.y + direction.y;

  if (
    newX < 0 ||
    newX >= state.dungeon.width ||
    newY < 0 ||
    newY >= state.dungeon.height
  ) {
    return false;
  }

  const tile = state.dungeon.tiles[newY]?.[newX];
  if (!tile || tile.type === "wall" || tile.type === "void") {
    return false;
  }

  const enemyAtPos = state.enemies.find(
    (e) => e.position.x === newX && e.position.y === newY && e.hp > 0
  );
  if (enemyAtPos) {
    return false;
  }

  state.player.position.x = newX;
  state.player.position.y = newY;

  const dirLabel =
    direction.x > 0 ? "east" :
    direction.x < 0 ? "west" :
    direction.y > 0 ? "south" : "north";
  state.turnEvents.push({ kind: "move", direction: dirLabel });

  if (tile.type === "stairs") {
    const livingEnemies = state.enemies.filter((e) => e.hp > 0);
    if (livingEnemies.length > 0) {
      addLog(state, `${livingEnemies.length} bug(s) remain! Clear them first.`);
    } else {
      handleMilestoneClear(state);
    }
  }

  return true;
}

function spawnEnemies(state: GameState): void {
  const milestoneIdx = state.milestone.floor - 1;
  const milestoneData = MILESTONES[milestoneIdx];
  const enemyCount = milestoneData?.enemyCount ?? 3;
  const hpMult = milestoneData?.enemyHpMult ?? 1.0;
  const atkMult = milestoneData?.enemyAtkMult ?? 1.0;

  state.enemies = [];

  // Get floor tiles that aren't player position or stairs
  const floorTiles: Position[] = [];
  for (let y = 0; y < state.dungeon.height; y++) {
    for (let x = 0; x < state.dungeon.width; x++) {
      const tile = state.dungeon.tiles[y]?.[x];
      if (!tile || tile.type !== "floor") continue;
      const dist = Math.abs(x - state.player.position.x) + Math.abs(y - state.player.position.y);
      if (dist < 5) continue; // Don't spawn too close
      floorTiles.push({ x, y });
    }
  }

  // Shuffle and pick positions
  for (let i = floorTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [floorTiles[i], floorTiles[j]] = [floorTiles[j]!, floorTiles[i]!];
  }

  for (let i = 0; i < Math.min(enemyCount, floorTiles.length); i++) {
    const pos = floorTiles[i]!;
    const variant = randomEnemyVariant();
    state.enemies.push(createEnemy(variant, pos, hpMult, atkMult));
  }
}

function handleMilestoneClear(state: GameState): void {
  addLog(state, `Milestone ${state.milestone.version} cleared!`);
  advanceMilestone(state);

  // Generate new dungeon
  const { dungeon, playerStart } = generateDungeon();
  state.dungeon = dungeon;
  state.player.position = { ...playerStart };

  // Restore DL
  const milestoneData = MILESTONES[state.milestone.floor - 1];
  const dlBonus = milestoneData?.dlBonus ?? 10;
  state.player.dl = Math.min(state.player.maxDl, state.player.dl + INITIAL_DL + dlBonus);
  state.burnoutMode = false;

  // Spawn enemies for new floor
  spawnEnemies(state);

  addLog(state, `Deadline extended! DL restored.`);
  computeFOV(state.dungeon, state.player.position);
}

function endOfTurn(state: GameState): void {
  state.turnCount++;

  // DL decay
  state.player.dl = Math.max(0, state.player.dl - DL_DECAY_PER_TURN);

  // Check burnout mode
  if (state.player.dl <= 0 && !state.burnoutMode) {
    state.burnoutMode = true;
    addLog(state, "BURNOUT MODE! Deadline exceeded! Enemies are empowered!");
  }

  // Burnout damage
  if (state.burnoutMode) {
    state.player.mh = Math.max(0, state.player.mh - BURNOUT_DAMAGE_PER_TURN);
    state.turnEvents.push({ kind: "burnout_tick", amount: BURNOUT_DAMAGE_PER_TURN });
    addLog(state, `Burnout! You take ${BURNOUT_DAMAGE_PER_TURN} stress damage.`);
  }

  // Reset defending (but keep for this turn's enemy attacks)
  // Defending resets at start of next player turn, not here
  // Actually let's reset it here since enemy attacks already happened
  state.player.defending = false;
  state.player.defenseMultiplier = 1.0;

  // Check game over
  if (state.player.mh <= 0) {
    state.phase = "game_over";
    addLog(state, "Mental Health depleted... You burned out.");
  }
}

export function advanceMilestone(state: GameState): void {
  const nextFloor = state.milestone.floor + 1;
  state.milestone.floor = nextFloor;

  const majorVersion = Math.floor((nextFloor - 1) / 3) + 1;
  const minorVersion = (nextFloor - 1) % 3;
  state.milestone.version = `v${majorVersion}.${minorVersion}.0`;

  state.burnoutMode = false;
  addLog(state, `New milestone: ${state.milestone.version}`);
}

function handleXpInvest(state: GameState, stackType: TechStackType): void {
  const available = getAvailableXp(state);
  const cost = getUpgradeCost(state.techStacks[stackType]);

  if (!canUpgrade(state.techStacks, stackType)) {
    addLog(state, `${stackType} is already at max level!`);
    return;
  }

  if (available < cost) {
    addLog(state, `Not enough XP! Need ${cost}, have ${available}.`);
    return;
  }

  upgradeStack(state.techStacks, stackType);
  updateTitle(state);
  addLog(state, `Upgraded ${stackType} to level ${state.techStacks[stackType]}!`);
}

function handleNewGame(state: GameState): void {
  // Preserve persistent data
  const techStacks = { ...state.techStacks };
  const totalXp = state.totalXp;
  const title = state.title;
  const scriptKiddie = state.scriptKiddie;

  // Reset to fresh game state
  const newState = createInitialGameState();
  Object.assign(state, newState);

  // Restore persistent data
  state.techStacks = techStacks;
  state.totalXp = totalXp;
  state.title = title;
  state.scriptKiddie = scriptKiddie;
  state.phase = "exploring";
  state.log = ["New run started! Good luck, developer."];

  spawnEnemies(state);
  computeFOV(state.dungeon, state.player.position);
}
