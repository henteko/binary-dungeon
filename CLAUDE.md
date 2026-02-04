# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Binary Dungeon is a tactical TUI roguelike built with TypeScript, Bun, and @opentui/core. Players navigate procedurally generated dungeons, fight programming-themed bugs, and invest XP into persistent tech stack upgrades across runs.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Run directly from source (bun src/index.ts)
bun run build        # Production build with Vite SSR → dist/index.js
bun run start        # Run production build (bun dist/index.js)
```

No test suite exists.

## Architecture

**Entry point:** `src/index.ts` creates a `CliRenderer` from @opentui/core and mounts `App`.

**Turn-based game loop** (`src/game/GameLoop.ts`):
1. Player input mapped to `GameEvent` via `InputHandler`
2. Player action resolved (move, combat action, wait)
3. Enemy AI executes (chase within range 10, attack if adjacent)
4. FOV recalculated via shadowcasting
5. End-of-turn: deadline decays, burnout damage applied

**Game phases:** `title` → `exploring` → `game_over` → `xp_invest` → loops back to `exploring`

**Key modules:**
- `src/dungeon/` — BSP dungeon generation (50x20 grid, max depth 5) and recursive shadowcasting FOV (radius 8)
- `src/combat/` — Action definitions with tech stack modifiers (`ActionDefinitions.ts`), action execution (`ActionResolver.ts`), enemy chase/attack AI (`EnemyAI.ts`)
- `src/progression/` — Meta-progression: tech stack upgrades (Python/C++/Rust/Go, max level 10) and XP-based title system
- `src/save/` — YAML persistence to `~/.binary-dungeon/save.yaml` with HMAC-SHA256 tamper detection (secret key in `~/.binary-dungeon/.secret_key`)
- `src/ui/` — @opentui/core layout: header, dungeon view (FrameBufferRenderable), status panel, log panel. `App.ts` owns all UI composition and state wiring

**State:** `GameState` (defined in `src/game/types.ts`) is the single source of truth — player stats, enemies, dungeon tiles, visibility, milestone progress, tech stacks, and log messages.

**Balance constants** are centralized in `src/game/constants.ts` (resource values, enemy stats, milestone scaling, tech stack effects, colors).

## Build Configuration

- TypeScript strict mode, ESNext target, ESM modules
- Vite SSR build externalizes @opentui/core, node:* builtins, and yaml
- Bun runtime with `peer = false` in bunfig.toml
