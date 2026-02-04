export function formatBar(label: string, current: number, max: number, fillChar: string, emptyChar: string, barLen: number = 10): string {
  const ratio = max > 0 ? current / max : 0;
  const filled = Math.round(ratio * barLen);
  const bar = fillChar.repeat(filled) + emptyChar.repeat(barLen - filled);
  return `${label}: [${bar}] ${current}/${max}`;
}
