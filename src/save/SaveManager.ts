import { stringify, parse } from "yaml";
import { readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { GameState, TechStacks } from "../game/types.ts";
import { generateSignature, verifySignature } from "./SignatureManager.ts";

const SAVE_DIR = join(homedir(), ".binary-dungeon");
const SAVE_FILE = join(SAVE_DIR, "save.yaml");
const SLOT_FILES = [
  join(SAVE_DIR, "slot1.yaml"),
  join(SAVE_DIR, "slot2.yaml"),
  join(SAVE_DIR, "slot3.yaml"),
];

export type SaveData = {
  techStacks: TechStacks;
  totalXp: number;
  title: string;
  scriptKiddie: boolean;
  highestMilestone: number;
};

export type LoadResult = {
  data: SaveData;
  valid: boolean;
  tampered: boolean;
};

function extractSaveData(state: GameState): SaveData {
  return {
    techStacks: { ...state.techStacks },
    totalXp: state.totalXp,
    title: state.title,
    scriptKiddie: state.scriptKiddie,
    highestMilestone: state.milestone.floor,
  };
}

function canonicalize(data: SaveData): string {
  return JSON.stringify(data, Object.keys(data).sort());
}

export function saveGame(state: GameState): void {
  const data = extractSaveData(state);
  const canonical = canonicalize(data);
  const signature = generateSignature(canonical);

  const saveContent = {
    ...data,
    signature,
  };

  const yamlStr = stringify(saveContent);

  if (!existsSync(SAVE_DIR)) {
    const { mkdirSync } = require("node:fs") as typeof import("node:fs");
    mkdirSync(SAVE_DIR, { recursive: true });
  }

  writeFileSync(SAVE_FILE, yamlStr, "utf-8");
}

export function loadGame(): LoadResult | null {
  if (!existsSync(SAVE_FILE)) {
    return null;
  }

  try {
    const yamlStr = readFileSync(SAVE_FILE, "utf-8");
    const parsed = parse(yamlStr) as Record<string, unknown>;

    const signature = parsed.signature as string;
    delete parsed.signature;

    const data: SaveData = {
      techStacks: (parsed.techStacks as TechStacks) ?? { python: 0, cpp: 0, rust: 0, go: 0 },
      totalXp: (parsed.totalXp as number) ?? 0,
      title: (parsed.title as string) ?? "Junior",
      scriptKiddie: (parsed.scriptKiddie as boolean) ?? false,
      highestMilestone: (parsed.highestMilestone as number) ?? 1,
    };

    const canonical = canonicalize(data);
    const valid = verifySignature(canonical, signature);

    return {
      data,
      valid,
      tampered: !valid,
    };
  } catch {
    return null;
  }
}

export function applySaveData(state: GameState, result: LoadResult): void {
  const { data, tampered } = result;

  state.techStacks = { ...data.techStacks };
  state.totalXp = data.totalXp;
  state.title = data.title;

  if (tampered) {
    state.scriptKiddie = true;
    state.title = "Script Kiddie";
  } else {
    state.scriptKiddie = data.scriptKiddie;
  }
}

function getSlotFile(slot: number): string {
  const file = SLOT_FILES[slot - 1];
  if (!file) throw new Error(`Invalid slot number: ${slot}`);
  return file;
}

function ensureSaveDir(): void {
  if (!existsSync(SAVE_DIR)) {
    const { mkdirSync } = require("node:fs") as typeof import("node:fs");
    mkdirSync(SAVE_DIR, { recursive: true });
  }
}

export function migrateOldSave(): void {
  if (existsSync(SAVE_FILE) && !existsSync(SLOT_FILES[0]!)) {
    ensureSaveDir();
    renameSync(SAVE_FILE, SLOT_FILES[0]!);
  }
}

export function saveGameSlot(state: GameState, slot: number): void {
  const data = extractSaveData(state);
  const canonical = canonicalize(data);
  const signature = generateSignature(canonical);

  const saveContent = {
    ...data,
    signature,
  };

  const yamlStr = stringify(saveContent);
  ensureSaveDir();
  writeFileSync(getSlotFile(slot), yamlStr, "utf-8");
}

export function loadGameSlot(slot: number): LoadResult | null {
  const file = getSlotFile(slot);
  if (!existsSync(file)) {
    return null;
  }

  try {
    const yamlStr = readFileSync(file, "utf-8");
    const parsed = parse(yamlStr) as Record<string, unknown>;

    const signature = parsed.signature as string;
    delete parsed.signature;

    const data: SaveData = {
      techStacks: (parsed.techStacks as TechStacks) ?? { python: 0, cpp: 0, rust: 0, go: 0 },
      totalXp: (parsed.totalXp as number) ?? 0,
      title: (parsed.title as string) ?? "Junior",
      scriptKiddie: (parsed.scriptKiddie as boolean) ?? false,
      highestMilestone: (parsed.highestMilestone as number) ?? 1,
    };

    const canonical = canonicalize(data);
    const valid = verifySignature(canonical, signature);

    return {
      data,
      valid,
      tampered: !valid,
    };
  } catch {
    return null;
  }
}

export function deleteSlot(slot: number): void {
  const file = getSlotFile(slot);
  if (existsSync(file)) {
    unlinkSync(file);
  }
}

export function loadAllSlotPreviews(): (SaveData | null)[] {
  return [1, 2, 3].map((slot) => {
    const result = loadGameSlot(slot);
    return result ? result.data : null;
  });
}
