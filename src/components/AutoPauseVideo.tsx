"use client";

import { type ComponentProps, useEffect, useRef } from "react";

export default function AutoPauseVideo(props: ComponentProps<"video">) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || typeof IntersectionObserver === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // autoplay can be blocked (e.g. Low Power Mode); the poster stays
          });
        } else {
          video.pause();
        }
      },
      { rootMargin: "96px" },
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  return <video ref={videoRef} {...props} />;
}
