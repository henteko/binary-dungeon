import {
  BoxRenderable,
  TextRenderable,
  TextAttributes,
  type CliRenderer,
} from "@opentui/core";
import type { GameState } from "../../game/types.ts";
import { COLORS } from "../../game/constants.ts";

export class StatusPanel {
  private container: BoxRenderable;
  private playerInfoText: TextRenderable;
  private mhBarText: TextRenderable;
  private dlBarText: TextRenderable;
  private turnText: TextRenderable;

  constructor(renderer: CliRenderer) {
    this.container = new BoxRenderable(renderer, {
      id: "status-panel",
      width: 30,
      borderStyle: "single",
      border: true,
      borderColor: COLORS.panelBorder,
      backgroundColor: COLORS.background,
      flexDirection: "column",
      padding: 1,
      gap: 1,
    });

    this.playerInfoText = new TextRenderable(renderer, {
      id: "player-info",
      content: "",
      fg: COLORS.textPrimary,
    });

    const resourcesLabel = new TextRenderable(renderer, {
      id: "resources-label",
      content: "[ RESOURCES ]",
      fg: COLORS.textSecondary,
      attributes: TextAttributes.BOLD,
    });

    this.mhBarText = new TextRenderable(renderer, {
      id: "mh-bar",
      content: "",
      fg: COLORS.mhBar,
    });

    this.dlBarText = new TextRenderable(renderer, {
      id: "dl-bar",
      content: "",
      fg: COLORS.dlBar,
    });

    const actionsLabel = new TextRenderable(renderer, {
      id: "actions-label",
      content: "[ ACTIONS ]",
      fg: COLORS.textSecondary,
      attributes: TextAttributes.BOLD,
    });

    const actionsText = new TextRenderable(renderer, {
      id: "actions-text",
      content: "(D)ebug  (H)otfix\n(G)oogle (R)efactor",
      fg: COLORS.textPrimary,
    });

    this.turnText = new TextRenderable(renderer, {
      id: "turn-text",
      content: "",
      fg: COLORS.textMuted,
    });

    this.container.add(this.playerInfoText);
    this.container.add(resourcesLabel);
    this.container.add(this.mhBarText);
    this.container.add(this.dlBarText);
    this.container.add(actionsLabel);
    this.container.add(actionsText);
    this.container.add(this.turnText);
  }

  getRenderable(): BoxRenderable {
    return this.container;
  }

  update(state: GameState): void {
    const { player, turnCount, burnoutMode } = state;

    const title = state.scriptKiddie ? "Script Kiddie" : state.title;
    this.playerInfoText.content = `Player: ${player.name}\nRank:   ${title}`;

    // MH bar
    const mhRatio = player.mh / player.maxMh;
    const mhBarLen = 10;
    const mhFilled = Math.round(mhRatio * mhBarLen);
    const mhBar = "#".repeat(mhFilled) + "-".repeat(mhBarLen - mhFilled);
    this.mhBarText.content = `MH: [${mhBar}] ${player.mh}/${player.maxMh}`;
    this.mhBarText.fg = burnoutMode ? COLORS.burnout : COLORS.mhBar;

    // DL bar
    const dlRatio = player.dl / player.maxDl;
    const dlBarLen = 10;
    const dlFilled = Math.round(dlRatio * dlBarLen);
    const dlBar = "|".repeat(dlFilled) + " ".repeat(dlBarLen - dlFilled);
    this.dlBarText.content = `DL: [${dlBar}] ${player.dl}/${player.maxDl}`;
    this.dlBarText.fg = burnoutMode ? COLORS.burnout : COLORS.dlBar;

    this.turnText.content = `Turn: ${turnCount}`;
  }
}
