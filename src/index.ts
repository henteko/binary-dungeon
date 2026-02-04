import { createCliRenderer } from "@opentui/core";
import { COLORS } from "./game/constants.ts";
import { App } from "./ui/App.ts";

async function main() {
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
