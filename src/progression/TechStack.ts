import type { TechStacks, TechStackType } from "../game/types.ts";
import { MAX_STACK_LEVEL, TECH_STACK_EFFECTS } from "../game/constants.ts";

export type TechStackInfo = {
  type: TechStackType;
  name: string;
  description: string;
  effectDescription: string;
};

export const TECH_STACK_INFO: TechStackInfo[] = [
  {
    type: "python",
    name: "Python",
    description: "Debug MH efficiency",
    effectDescription: `-${(TECH_STACK_EFFECTS.python.mhCostReduction * 100).toFixed(0)}% MH cost per level`,
  },
  {
    type: "cpp",
    name: "C++",
    description: "Hotfix power",
    effectDescription: `+${(TECH_STACK_EFFECTS.cpp.hotfixPowerBonus * 100).toFixed(0)}% damage per level`,
  },
  {
    type: "rust",
    name: "Rust",
    description: "Refactor defense",
    effectDescription: `+${(TECH_STACK_EFFECTS.rust.defenseBonus * 100).toFixed(0)}% defense per level`,
  },
  {
    type: "go",
    name: "Go",
    description: "Google It efficiency",
    effectDescription: `-${(TECH_STACK_EFFECTS.go.dlCostReduction * 100).toFixed(0)}% DL cost per level`,
  },
];

export function canUpgrade(stacks: TechStacks, type: TechStackType): boolean {
  return stacks[type] < MAX_STACK_LEVEL;
}

export function getUpgradeCost(level: number): number {
  return (level + 1) * 30;
}

export function upgradeStack(stacks: TechStacks, type: TechStackType): number {
  const cost = getUpgradeCost(stacks[type]);
  stacks[type]++;
  return cost;
}
