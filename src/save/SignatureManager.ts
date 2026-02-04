import { createHmac, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const KEY_DIR = join(homedir(), ".binary-dungeon");
const KEY_FILE = join(KEY_DIR, ".secret_key");

function ensureKeyDir(): void {
  if (!existsSync(KEY_DIR)) {
    mkdirSync(KEY_DIR, { recursive: true });
  }
}

function getOrCreateKey(): Buffer {
  ensureKeyDir();
  if (existsSync(KEY_FILE)) {
    return readFileSync(KEY_FILE);
  }
  const key = randomBytes(32);
  writeFileSync(KEY_FILE, key, { mode: 0o600 });
  return key;
}

export function generateSignature(data: string): string {
  const key = getOrCreateKey();
  const hmac = createHmac("sha256", key);
  hmac.update(data);
  return hmac.digest("hex");
}

export function verifySignature(data: string, signature: string): boolean {
  const expected = generateSignature(data);
  return expected === signature;
}
