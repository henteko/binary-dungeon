import {
  type CliRenderer,
  BoxRenderable,
  TextRenderable,
  TextAttributes,
  type KeyEvent,
} from "@opentui/core";
import type { GameState } from "../game/types.ts";
import { createInitialGameState, addLog } from "../game/GameState.ts";
import { processTurn, type GameEvent } from "../game/GameLoop.ts";
import { COLORS, GAME_TITLE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from "../game/constants.ts";
import { InputHandler } from "./InputHandler.ts";
import { DungeonView } from "./components/DungeonView.ts";
import { getAvailableXp } from "../progression/XPManager.ts";
import { TECH_STACK_INFO, getUpgradeCost } from "../progression/TechStack.ts";
import {
  type SaveData,
  saveGameSlot,
  loadGameSlot,
  deleteSlot,
  loadAllSlotPreviews,
  applySaveData,
  migrateOldSave,
} from "../save/SaveManager.ts";

export class App {
  private renderer: CliRenderer;
  private state: GameState;
  private inputHandler: InputHandler;
  private dungeonView: DungeonView;
  private activeSlot: number = 1;
  private deleteMode: boolean = false;
  private slotPreviews: (SaveData | null)[] = [null, null, null];

  // UI elements
  private titleText!: TextRenderable;
  private milestoneText!: TextRenderable;
  private playerInfoText!: TextRenderable;
  private mhBarText!: TextRenderable;
  private dlBarText!: TextRenderable;
  private logText!: TextRenderable;
  private turnText!: TextRenderable;
  private techStackText!: TextRenderable;
  private lastActionText!: TextRenderable;
  private dungeonPanel!: BoxRenderable;
  private titleOverlay!: TextRenderable;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;
    this.state = createInitialGameState();
    this.inputHandler = new InputHandler();
    this.dungeonView = new DungeonView(renderer, DUNGEON_WIDTH, DUNGEON_HEIGHT);

    // Migrate old save.yaml to slot1.yaml if needed
    migrateOldSave();

    // Load slot previews for title screen
    this.slotPreviews = loadAllSlotPreviews();

    this.inputHandler.setCallback((event: GameEvent) => {
      this.handleGameEvent(event);
    });

    this.buildUI();
    this.setupInput();
    this.updateUI();
  }

  private buildUI(): void {
    const root = this.renderer.root;

    // Header row
    const header = new BoxRenderable(this.renderer, {
      id: "header",
      height: 3,
      borderStyle: "rounded",
      border: true,
      borderColor: COLORS.panelBorder,
      backgroundColor: COLORS.background,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingLeft: 2,
      paddingRight: 2,
    });

    this.titleText = new TextRenderable(this.renderer, {
      id: "title-text",
      content: `[ ${GAME_TITLE} ]`,
      fg: COLORS.title,
      attributes: TextAttributes.BOLD,
    });

    this.milestoneText = new TextRenderable(this.renderer, {
      id: "milestone-text",
      content: "",
      fg: COLORS.title,
      attributes: TextAttributes.BOLD,
    });

    header.add(this.titleText);
    header.add(this.milestoneText);

    // Body: dungeon (left) + status (right)
    const body = new BoxRenderable(this.renderer, {
      id: "body",
      flexGrow: 1,
      flexDirection: "row",
    });

    // Dungeon panel
    this.dungeonPanel = new BoxRenderable(this.renderer, {
      id: "dungeon-panel",
      flexGrow: 1,
      borderStyle: "single",
      border: true,
      borderColor: COLORS.panelBorder,
      backgroundColor: COLORS.background,
      overflow: "hidden",
    });

    // Title overlay (shown before game starts)
    this.titleOverlay = new TextRenderable(this.renderer, {
      id: "title-overlay",
      content: "Select a save slot to start...",
      fg: COLORS.textSecondary,
    });

    // Add dungeon framebuffer
    this.dungeonPanel.add(this.dungeonView.getRenderable());
    this.dungeonPanel.add(this.titleOverlay);

    // Status panel
    const statusPanel = new BoxRenderable(this.renderer, {
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

    this.playerInfoText = new TextRenderable(this.renderer, {
      id: "player-info",
      content: "",
      fg: COLORS.textPrimary,
    });

    const resourcesLabel = new TextRenderable(this.renderer, {
      id: "resources-label",
      content: "[ RESOURCES ]",
      fg: COLORS.textSecondary,
      attributes: TextAttributes.BOLD,
    });

    this.mhBarText = new TextRenderable(this.renderer, {
      id: "mh-bar",
      content: "",
      fg: COLORS.mhBar,
    });

    this.dlBarText = new TextRenderable(this.renderer, {
      id: "dl-bar",
      content: "",
      fg: COLORS.dlBar,
    });

    const actionsLabel = new TextRenderable(this.renderer, {
      id: "actions-label",
      content: "[ ACTIONS ]",
      fg: COLORS.textSecondary,
      attributes: TextAttributes.BOLD,
    });

    const actionsText = new TextRenderable(this.renderer, {
      id: "actions-text",
      content: "1:Debug   2:Hotfix\n3:Google  4:Refactor",
      fg: COLORS.textPrimary,
    });

    const techStackLabel = new TextRenderable(this.renderer, {
      id: "techstack-label",
      content: "[ TECH STACKS ]",
      fg: COLORS.textSecondary,
      attributes: TextAttributes.BOLD,
    });

    this.techStackText = new TextRenderable(this.renderer, {
      id: "techstack-text",
      content: "",
      fg: COLORS.textPrimary,
    });

    const lastActionLabel = new TextRenderable(this.renderer, {
      id: "lastaction-label",
      content: "[ LAST ACTION ]",
      fg: COLORS.textSecondary,
      attributes: TextAttributes.BOLD,
    });

    this.lastActionText = new TextRenderable(this.renderer, {
      id: "lastaction-text",
      content: "",
      fg: COLORS.textPrimary,
    });

    this.turnText = new TextRenderable(this.renderer, {
      id: "turn-text",
      content: "",
      fg: COLORS.textMuted,
    });

    statusPanel.add(this.playerInfoText);
    statusPanel.add(resourcesLabel);
    statusPanel.add(this.mhBarText);
    statusPanel.add(this.dlBarText);
    statusPanel.add(techStackLabel);
    statusPanel.add(this.techStackText);
    statusPanel.add(actionsLabel);
    statusPanel.add(actionsText);
    statusPanel.add(lastActionLabel);
    statusPanel.add(this.lastActionText);
    statusPanel.add(this.turnText);

    body.add(this.dungeonPanel);
    body.add(statusPanel);

    // Log panel
    const logPanel = new BoxRenderable(this.renderer, {
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

    const logLabel = new TextRenderable(this.renderer, {
      id: "log-label",
      content: "[ LOG ]",
      fg: COLORS.textSecondary,
      attributes: TextAttributes.BOLD,
    });

    this.logText = new TextRenderable(this.renderer, {
      id: "log-text",
      content: "",
      fg: COLORS.log,
    });

    logPanel.add(logLabel);
    logPanel.add(this.logText);

    // Assemble
    root.add(header);
    root.add(body);
    root.add(logPanel);
  }

  private setupInput(): void {
    this.renderer.keyInput.on("keypress", (key: KeyEvent) => {
      if (key.name === "q" && !key.ctrl && !key.meta) {
        this.renderer.destroy();
        return;
      }
      this.inputHandler.handleKey(key);
    });
  }

  private handleGameEvent(event: GameEvent): void {
    // Handle slot selection and delete mode in title phase (before processTurn)
    if (this.state.phase === "title") {
      if (event.type === "toggle_delete_mode") {
        this.deleteMode = !this.deleteMode;
        this.updateUI();
        return;
      }
      if (event.type === "select_slot") {
        if (this.deleteMode) {
          deleteSlot(event.slot);
          this.slotPreviews = loadAllSlotPreviews();
          this.deleteMode = false;
          addLog(this.state, `Slot ${event.slot} deleted.`);
          this.updateUI();
          return;
        }
        this.activeSlot = event.slot;
        const saveResult = loadGameSlot(event.slot);
        if (saveResult) {
          applySaveData(this.state, saveResult);
          if (saveResult.tampered) {
            addLog(this.state, "WARNING: Save data tampering detected!");
            addLog(this.state, "Your title is now permanently 'Script Kiddie'.");
          }
        }
        processTurn(this.state, { type: "start_game" });
        this.inputHandler.setGamePhase(this.state.phase);
        this.updateUI();
        return;
      }
    }

    const prevPhase = this.state.phase;
    processTurn(this.state, event);
    this.inputHandler.setGamePhase(this.state.phase);

    // ゲームオーバー時: セーブ
    if (this.state.phase === "game_over" && prevPhase !== "game_over") {
      saveGameSlot(this.state, this.activeSlot);
    }

    if (event.type === "invest_xp" || event.type === "finish_invest") {
      saveGameSlot(this.state, this.activeSlot);
    }

    this.updateUI();
  }

  private updateUI(): void {
    const { player, milestone, turnCount, burnoutMode, log } = this.state;

    // Milestone + burnout indicator
    const burnoutLabel = burnoutMode ? " !! BURNOUT !!" : "";
    this.milestoneText.content = `[ MILESTONE: ${milestone.version} ]${burnoutLabel}`;
    this.milestoneText.fg = burnoutMode ? COLORS.burnout : COLORS.title;

    // Player info
    const title = this.state.scriptKiddie ? "Script Kiddie" : this.state.title;
    const verified = this.state.scriptKiddie ? "" : " (Verified)";
    const livingEnemies = this.state.enemies.filter((e) => e.hp > 0).length;
    this.playerInfoText.content = `Player: ${player.name}\nRank:   ${title}${verified}\nBugs:   ${livingEnemies} remaining`;

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

    // Tech stacks
    const ts = this.state.techStacks;
    this.techStackText.content = `Py:${ts.python} C++:${ts.cpp} Rs:${ts.rust} Go:${ts.go}`;

    // Last action (turn events)
    this.lastActionText.content = formatTurnEventsForUI(this.state);

    // Turn counter
    this.turnText.content = `Turn: ${turnCount}`;

    // Log (show last 3 lines)
    const recentLog = log.slice(-3).map((l) => `> ${l}`).join("\n");
    this.logText.content = recentLog;

    // Phase-specific rendering
    if (this.state.phase === "title") {
      const titleArt = [
        "",
        "  ____  _                        ____                                   ",
        " | __ )(_)_ __   __ _ _ __ _   _|  _ \\ _   _ _ __   __ _  ___  ___  _ __",
        " |  _ \\| | '_ \\ / _` | '__| | | | | | | | | | '_ \\ / _` |/ _ \\/ _ \\| '_ \\",
        " | |_) | | | | | (_| | |  | |_| | |_| | |_| | | | | (_| |  __/ (_) | | | |",
        " |____/|_|_| |_|\\__,_|_|   \\__, |____/ \\__,_|_| |_|\\__, |\\___|\\___/|_| |_|",
        "                           |___/                    |___/",
        "",
        "             Debug bugs. Ship code. Don't burn out.",
        "",
        "  ╔══════════════════════════════════════╗",
        "  ║           SAVE SLOTS                 ║",
        "  ╚══════════════════════════════════════╝",
        "",
      ];

      for (let i = 0; i < 3; i++) {
        const preview = this.slotPreviews[i];
        if (preview) {
          const ts = preview.techStacks;
          titleArt.push(
            `  ${i + 1}: ${preview.title.padEnd(10)} | ${("v" + Math.floor((preview.highestMilestone - 1) / 3 + 1) + "." + ((preview.highestMilestone - 1) % 3) + ".0").padEnd(7)} | Py:${ts.python} C++:${ts.cpp} Rs:${ts.rust} Go:${ts.go}`
          );
        } else {
          titleArt.push(`  ${i + 1}: --- Empty ---`);
        }
      }

      titleArt.push("");
      if (this.deleteMode) {
        titleArt.push("  DELETE MODE: Press 1-3 to delete a slot, D to cancel");
      } else {
        titleArt.push("  1-3: Select slot  D: Delete slot  Q: Quit");
      }

      this.titleOverlay.content = titleArt.join("\n");
      this.titleOverlay.visible = true;
      this.titleOverlay.fg = this.deleteMode ? COLORS.burnout : COLORS.title;
      this.dungeonView.getRenderable().visible = false;
    } else if (this.state.phase === "game_over") {
      const gameOverArt = [
        "",
        "   ____    _    __  __ _____    _____     _______ ____  ",
        "  / ___|  / \\  |  \\/  | ____|  / _ \\ \\   / / ____|  _ \\ ",
        " | |  _  / _ \\ | |\\/| |  _|   | | | \\ \\ / /|  _| | |_) |",
        " | |_| |/ ___ \\| |  | | |___  | |_| |\\ V / | |___|  _ < ",
        "  \\____/_/   \\_\\_|  |_|_____|  \\___/  \\_/  |_____|_| \\_\\",
        "",
        `  You burned out at Milestone ${this.state.milestone.version}`,
        `  Turns survived: ${this.state.turnCount}`,
        `  Total XP earned: ${this.state.totalXp}`,
        "",
        "          [ Press ENTER to invest XP ]",
        "          [ Press 'q' to quit ]",
      ];
      this.titleOverlay.content = gameOverArt.join("\n");
      this.titleOverlay.visible = true;
      this.titleOverlay.fg = COLORS.burnout;
      this.dungeonView.getRenderable().visible = false;
    } else if (this.state.phase === "xp_invest") {
      const available = getAvailableXp(this.state);
      const lines = [
        "",
        "  ╔══════════════════════════════════════╗",
        "  ║       TECH STACK INVESTMENT          ║",
        "  ╚══════════════════════════════════════╝",
        "",
        `  Available XP: ${available}`,
        "",
      ];
      for (let i = 0; i < TECH_STACK_INFO.length; i++) {
        const info = TECH_STACK_INFO[i]!;
        const level = this.state.techStacks[info.type];
        const cost = getUpgradeCost(level);
        const bar = "█".repeat(level) + "░".repeat(10 - level);
        lines.push(`  ${i + 1}: ${info.name.padEnd(8)} [${bar}] Lv.${level}`);
        lines.push(`     ${info.effectDescription} (cost: ${cost} XP)`);
      }
      lines.push("");
      lines.push("  Press 1-4 to invest, ENTER to start new run");
      this.titleOverlay.content = lines.join("\n");
      this.titleOverlay.visible = true;
      this.titleOverlay.fg = COLORS.title;
      this.dungeonView.getRenderable().visible = false;
    } else {
      this.titleOverlay.visible = false;
      this.dungeonView.getRenderable().visible = true;
      this.dungeonView.render(this.state);
    }
  }

  getState(): GameState {
    return this.state;
  }
}

function formatTurnEventsForUI(state: GameState): string {
  const lines: string[] = [];
  for (const ev of state.turnEvents) {
    switch (ev.kind) {
      case "action":
        lines.push(`> ${ev.label}`);
        break;
      case "damage_dealt":
        lines.push(ev.killed ? `  -> ${ev.target} -${ev.amount} KILLED!` : `  -> ${ev.target} -${ev.amount}`);
        break;
      case "damage_taken":
        lines.push(`  <- ${ev.source} -${ev.amount} MH`);
        break;
      case "heal":
        lines.push(`  +${ev.amount} MH healed`);
        break;
      case "move":
        lines.push(`> Move ${ev.direction}`);
        break;
      case "wait":
        lines.push(`> Wait...`);
        break;
      case "stunned":
        lines.push(`> Stunned (cooldown)`);
        break;
      case "burnout_tick":
        lines.push(`  BURNOUT -${ev.amount} MH`);
        break;
    }
  }
  return lines.slice(0, 3).join("\n");
}
