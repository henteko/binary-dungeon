import {
  BoxRenderable,
  TextRenderable,
  TextAttributes,
  type CliRenderer,
} from "@opentui/core";
import type { GameState } from "../../game/types.ts";
import { COLORS } from "../../game/constants.ts";

export class LogPanel {
  private container: BoxRenderable;
  private logText: TextRenderable;

  constructor(renderer: CliRenderer) {
    this.container = new BoxRenderable(renderer, {
      id: "log-panel",
      height: 6,
      borderStyle: "single",
      border: true,
      borderColor: COLORS.panelBorder,
      backgroundColor: COLORS.background,
      flexDirection: "column",
      paddingLeft: 1,
      paddingRight: 1,
    });

    const logLabel = new TextRenderable(renderer, {
      id: "log-label",
      content: "[ LOG ]",
      fg: COLORS.textSecondary,
      attributes: TextAttributes.BOLD,
    });

    this.logText = new TextRenderable(renderer, {
      id: "log-text",
      content: "",
      fg: COLORS.log,
    });

    this.container.add(logLabel);
    this.container.add(this.logText);
  }

  getRenderable(): BoxRenderable {
    return this.container;
  }

  update(state: GameState): void {
    const recentLog = state.log.slice(-3).map((l) => `> ${l}`).join("\n");
    this.logText.content = recentLog;
  }
}
