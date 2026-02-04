import { createCliRenderer } from "@opentui/core";
import { COLORS } from "./game/constants.ts";
import { App } from "./ui/App.ts";
import { playReplay } from "./replay/ReplayManager.ts";

async function main() {
  const args = process.argv.slice(2);

  // Handle --replay mode
  if (args[0] === "--replay" && args[1]) {
    await playReplay(args[1]);
    return;
  }

  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
    maxFps: 60,
    useMouse: false,
    useAlternateScreen: true,
  });

  renderer.setBackgroundColor(COLORS.background);

  new App(renderer);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
