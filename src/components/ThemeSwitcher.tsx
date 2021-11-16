import { useEffect, useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";

type Mode = "light" | "dark";

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
    <>
      <button
        className="p-0.5 text-gray-900 dark:text-gray-50"
        onClick={() => setMode(prevState => (prevState === "light" ? "dark" : "light"))}
      >
        <MdDarkMode style={{ display: mode === "dark" ? "none" : "block" }} />
        <MdLightMode style={{ display: mode === "light" ? "none" : "block" }} />
      </button>
    </>
  );
}
