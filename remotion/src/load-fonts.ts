import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Inter — the site's body + display face.
export const { fontFamily } = loadInter("normal", {
  weights: ["400", "500", "700", "800", "900"],
  subsets: ["latin"],
});

// JetBrains Mono — terminal / code face for the TerminalReel.
export const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400", "500", "700", "800"],
  subsets: ["latin"],
});
