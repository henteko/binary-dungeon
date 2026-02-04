import { writeFileSync, readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const REPLAY_DIR = join(homedir(), ".binary-dungeon", "replays");

// TTYrec format: each frame is [sec(4 bytes LE), usec(4 bytes LE), len(4 bytes LE), data(len bytes)]

export class ReplayRecorder {
  private filePath: string;
  private startTime: number;
  private initialized = false;

  constructor(sessionId?: string) {
    if (!existsSync(REPLAY_DIR)) {
      mkdirSync(REPLAY_DIR, { recursive: true });
    }
    const id = sessionId ?? new Date().toISOString().replace(/[:.]/g, "-");
    this.filePath = join(REPLAY_DIR, `${id}.ttyrec`);
    this.startTime = Date.now();
  }

  getFilePath(): string {
    return this.filePath;
  }

  recordFrame(data: string): void {
    const elapsed = Date.now() - this.startTime;
    const sec = Math.floor(elapsed / 1000);
    const usec = (elapsed % 1000) * 1000;
    const buf = Buffer.from(data, "utf-8");

    const header = Buffer.alloc(12);
    header.writeUInt32LE(sec, 0);
    header.writeUInt32LE(usec, 4);
    header.writeUInt32LE(buf.length, 8);

    const frame = Buffer.concat([header, buf]);

    if (!this.initialized) {
      writeFileSync(this.filePath, frame);
      this.initialized = true;
    } else {
      appendFileSync(this.filePath, frame);
    }
  }
}

export type TTYRecFrame = {
  sec: number;
  usec: number;
  data: string;
};

export function parseTTYRec(filePath: string): TTYRecFrame[] {
  const buf = readFileSync(filePath);
  const frames: TTYRecFrame[] = [];
  let offset = 0;

  while (offset + 12 <= buf.length) {
    const sec = buf.readUInt32LE(offset);
    const usec = buf.readUInt32LE(offset + 4);
    const len = buf.readUInt32LE(offset + 8);
    offset += 12;

    if (offset + len > buf.length) break;

    const data = buf.subarray(offset, offset + len).toString("utf-8");
    frames.push({ sec, usec, data });
    offset += len;
  }

  return frames;
}

export async function playReplay(filePath: string): Promise<void> {
  if (!existsSync(filePath)) {
    console.error(`Replay file not found: ${filePath}`);
    process.exit(1);
  }

  const frames = parseTTYRec(filePath);
  if (frames.length === 0) {
    console.error("No frames found in replay file.");
    process.exit(1);
  }

  console.log(`\x1b[2J\x1b[H`); // Clear screen
  console.log(`Playing replay: ${filePath}`);
  console.log(`Frames: ${frames.length}`);
  console.log("Press Ctrl+C to stop.\n");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  let prevTime = 0;
  for (const frame of frames) {
    const frameTime = frame.sec * 1000 + frame.usec / 1000;
    const delay = frameTime - prevTime;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 2000)));
    }
    process.stdout.write(frame.data);
    prevTime = frameTime;
  }

  console.log("\n\nReplay finished.");
}
