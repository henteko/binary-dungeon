import type { KeyEvent } from "@opentui/core";
import type { GameEvent } from "../game/GameLoop.ts";
import type { GamePhase } from "../game/types.ts";
import { keyToAction } from "./components/ActionPanel.ts";

export type InputCallback = (event: GameEvent) => void;

export class InputHandler {
  private callback: InputCallback | null = null;
  private enabled = true;
  private gamePhase: GamePhase = "title";

  setCallback(cb: InputCallback): void {
    this.callback = cb;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setGamePhase(phase: GamePhase): void {
    this.gamePhase = phase;
  }

  handleKey(key: KeyEvent): boolean {
    if (!this.enabled || !this.callback) return false;

    const event = this.mapKeyToEvent(key);
    if (event) {
      this.callback(event);
      return true;
    }
    return false;
  }

  private mapKeyToEvent(key: KeyEvent): GameEvent | null {
    if (this.gamePhase === "title") {
      if (key.name === "return") {
        return { type: "start_game" };
      }
      return null;
    }

    if (this.gamePhase === "game_over") {
      if (key.name === "return") {
        return { type: "start_game" }; // Transitions to xp_invest
      }
      return null;
    }

    if (this.gamePhase === "xp_invest") {
      if (key.name === "1") return { type: "invest_xp", stack: "python" };
      if (key.name === "2") return { type: "invest_xp", stack: "cpp" };
      if (key.name === "3") return { type: "invest_xp", stack: "rust" };
      if (key.name === "4") return { type: "invest_xp", stack: "go" };
      if (key.name === "return") return { type: "finish_invest" };
      return null;
    }

    // Movement: WASD, hjkl, arrow keys
    if (key.name === "w" || key.name === "k" || key.name === "up") {
      return { type: "move", direction: { x: 0, y: -1 } };
    }
    if (key.name === "s" || key.name === "j" || key.name === "down") {
      return { type: "move", direction: { x: 0, y: 1 } };
    }
    if (key.name === "a" || key.name === "h" || key.name === "left") {
      return { type: "move", direction: { x: -1, y: 0 } };
    }
    if (key.name === "d" || key.name === "l" || key.name === "right") {
      return { type: "move", direction: { x: 1, y: 0 } };
    }

    // Wait
    if (key.name === "." || key.name === "space") {
      return { type: "wait" };
    }

    // Combat actions (only when in exploring/combat)
    // Note: 'd' is also movement left, so we use 'f' for Debug to avoid conflict
    // Actually, 'd' is right in WASD. Let's keep original: d=right, so we need
    // separate combat keys. Use number keys or check for shift.
    // Per spec: (D)ebug (H)otfix (G)oogle (R)efactor
    // Conflict: d=right(WASD), h=left(vim). These overlap with movement.
    // Solution: Use 1,2,3,4 as alternative combat keys, and only trigger
    // the action key when not using WASD/vim movement.
    // Better: check if the key matches an action key that ISN'T a movement key
    if (key.name === "g") {
      return { type: "action", action: "google_it" };
    }
    if (key.name === "r") {
      return { type: "action", action: "refactor" };
    }

    // Number keys for all actions (no conflict)
    if (key.name === "1") {
      return { type: "action", action: "debug" };
    }
    if (key.name === "2") {
      return { type: "action", action: "hotfix" };
    }
    if (key.name === "3") {
      return { type: "action", action: "google_it" };
    }
    if (key.name === "4") {
      return { type: "action", action: "refactor" };
    }

    return null;
  }
}
