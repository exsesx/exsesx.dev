import Image from "next/image";
import { useEffect, useState } from "react";

type Mode = "light" | "dark";

// TODO: Persist from localStorage
export default function ThemeSwitcher() {
  const defaultMode: Mode =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const [mode, setMode] = useState<Mode>(defaultMode);

  useEffect(() => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  return (
    <button className="flex" onClick={() => setMode(prevState => (prevState === "light" ? "dark" : "light"))}>
      <Image src={mode === "dark" ? "/icons/light_mode.svg" : "/icons/dark_mode.svg"} width={24} height={24} />
    </button>
  );
}
