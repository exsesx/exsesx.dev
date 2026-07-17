"use client";

import { Pause, Play } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

type AutoPauseVideoProps = Omit<ComponentProps<"video">, "aria-label" | "autoPlay"> & {
  label: string;
};

export default function AutoPauseVideo({ className, label, ...props }: AutoPauseVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackPreferenceRef = useRef<"auto" | "pause" | "play">("auto");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isVisible = false;

    function syncPlayback() {
      const preference = playbackPreferenceRef.current;
      const shouldPlay =
        isVisible &&
        document.visibilityState !== "hidden" &&
        preference !== "pause" &&
        (preference === "play" || !reducedMotion.matches);

      if (!shouldPlay) {
        video?.pause();
        return;
      }

      video?.play().catch(() => {
        // Autoplay can be blocked (for example in Low Power Mode); the poster stays.
      });
    }

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        syncPlayback();
      },
      { rootMargin: "96px" },
    );

    observer.observe(video);
    reducedMotion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, []);

  function togglePlayback() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      playbackPreferenceRef.current = "play";
      video.play().catch(() => {});
      return;
    }

    playbackPreferenceRef.current = "pause";
    video.pause();
  }

  return (
    <div className="relative h-full">
      <video
        ref={videoRef}
        {...props}
        aria-label={label}
        className={className}
        onPause={() => setIsPlaying(false)}
        onPlaying={() => setIsPlaying(true)}
      />
      <Button
        type="button"
        variant="glass"
        size="icon"
        aria-label={`${isPlaying ? "Pause" : "Play"} ${label}`}
        className="glass-frost absolute right-4 bottom-4 z-10 rounded-full border-white/20 bg-slate-950/55 text-white shadow-lg hover:bg-slate-900/70 hover:text-white focus-visible:ring-white/50"
        onClick={togglePlayback}
      >
        {isPlaying ? (
          <Pause aria-hidden="true" size={17} fill="currentColor" />
        ) : (
          <Play aria-hidden="true" size={17} fill="currentColor" />
        )}
      </Button>
    </div>
  );
}
