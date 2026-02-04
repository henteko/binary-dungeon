import type { Item, ItemVariant, Position } from "../game/types.ts";
import { ITEM_WEIGHTS } from "../game/constants.ts";

let itemIdCounter = 0;

export function createItem(variant: ItemVariant, position: Position): Item {
  return {
    id: `item_${itemIdCounter++}`,
    variant,
    position: { ...position },
    pickedUp: false,
  };
}

const VARIANTS: ItemVariant[] = ["coffee", "pizza", "red_bull", "mech_keyboard", "nc_headphones", "sudo"];

export function randomItemVariant(): ItemVariant {
  const totalWeight = VARIANTS.reduce((sum, v) => sum + (ITEM_WEIGHTS[v] ?? 0), 0);
  let roll = Math.random() * totalWeight;

  for (const variant of VARIANTS) {
    roll -= ITEM_WEIGHTS[variant] ?? 0;
    if (roll <= 0) return variant;
  }

  return "coffee";
}
