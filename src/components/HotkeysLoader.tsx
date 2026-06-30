"use client";

import dynamic from "next/dynamic";

const Hotkeys = dynamic(() => import("./Hotkeys"), {
  ssr: false,
});

export default function HotkeysLoader() {
  return <Hotkeys />;
}
