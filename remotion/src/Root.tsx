import "./index.css";
import { Composition } from "remotion";
import "./load-fonts";
import { FPS } from "./brand";
import { LOOP_DURATION, LoopBanner } from "./compositions/LoopBanner";
import { SHOWREEL_DURATION, Showreel } from "./compositions/Showreel";
import { TERMINAL_REEL_DURATION, TerminalReel } from "./compositions/TerminalReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 16:9 brand film — the full showreel */}
      <Composition
        id="Showreel"
        component={Showreel}
        durationInFrames={SHOWREEL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* 9:16 social cut — same timeline, reflowed by aspect */}
      <Composition
        id="Vertical"
        component={Showreel}
        durationInFrames={SHOWREEL_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* 1:1 seamless looping hero banner for embedding on the site */}
      <Composition
        id="LoopBanner"
        component={LoopBanner}
        durationInFrames={LOOP_DURATION}
        fps={FPS}
        width={1080}
        height={1080}
      />

      {/* Bolder dev-native cut: terminal session + AI thinking -> cinematic montage */}
      <Composition
        id="TerminalReel"
        component={TerminalReel}
        durationInFrames={TERMINAL_REEL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* 9:16 social cut of the terminal reel — same timeline, reflowed by aspect */}
      <Composition
        id="TerminalReelVertical"
        component={TerminalReel}
        durationInFrames={TERMINAL_REEL_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
