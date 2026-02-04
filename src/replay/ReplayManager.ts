import { writeFileSync, readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const REPLAY_DIR = join(homedir(), ".binary-dungeon", "replays");

// asciicast v2 format
// Line 1: JSON header { "version": 2, "width": W, "height": H, "timestamp": N }
// Line 2+: [time, "o", data]   (time=float seconds, "o"=output event)

export class ReplayRecorder {
  private filePath: string;
  private startTime: number;
  private initialized = false;
  private width: number;
  private height: number;

  constructor(width: number = 80, height: number = 30, sessionId?: string) {
    if (!existsSync(REPLAY_DIR)) {
      mkdirSync(REPLAY_DIR, { recursive: true });
    }
    const id = sessionId ?? new Date().toISOString().replace(/[:.]/g, "-");
    this.filePath = join(REPLAY_DIR, `${id}.cast`);
    this.startTime = Date.now();
    this.width = width;
    this.height = height;
  }

  getFilePath(): string {
    return this.filePath;
  }

  recordFrame(data: string): void {
    const elapsed = (Date.now() - this.startTime) / 1000;

    if (!this.initialized) {
      const header = JSON.stringify({
        version: 2,
        width: this.width,
        height: this.height,
        timestamp: Math.floor(this.startTime / 1000),
        env: { TERM: "xterm-256color", SHELL: "/bin/bash" },
        title: "Binary Dungeon",
      });
      writeFileSync(this.filePath, header + "\n", "utf-8");
      this.initialized = true;
    }

    const event = JSON.stringify([
      parseFloat(elapsed.toFixed(6)),
      "o",
      data,
    ]);
    appendFileSync(this.filePath, event + "\n", "utf-8");
  }
}

export type AsciicastEvent = {
  time: number;
  type: string;
  data: string;
};

export function parseAsciicast(filePath: string): { width: number; height: number; events: AsciicastEvent[] } {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  if (lines.length === 0) {
    return { width: 80, height: 24, events: [] };
  }

  const header = JSON.parse(lines[0]!) as { width: number; height: number };
  const events: AsciicastEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const parsed = JSON.parse(line) as [number, string, string];
    events.push({ time: parsed[0], type: parsed[1], data: parsed[2] });
  }

  return { width: header.width, height: header.height, events };
}

export async function playReplay(filePath: string): Promise<void> {
  if (!existsSync(filePath)) {
    console.error(`Replay file not found: ${filePath}`);
    process.exit(1);
  }

  const { events } = parseAsciicast(filePath);
  if (events.length === 0) {
    console.error("No events found in replay file.");
    process.exit(1);
  }

  console.log(`\x1b[2J\x1b[H`);
  console.log(`Playing replay: ${filePath}`);
  console.log(`Events: ${events.length}`);
  console.log("Press Ctrl+C to stop.\n");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  let prevTime = 0;
  for (const event of events) {
    if (event.type !== "o") continue;
    const delay = (event.time - prevTime) * 1000;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 2000)));
    }
    process.stdout.write(event.data);
    prevTime = event.time;
  }

  console.log("\n\nReplay finished.");
}
