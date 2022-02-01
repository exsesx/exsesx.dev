import Head from "next/head";
import { SVGProps } from "react";
import { animated, useSpring } from "react-spring";
import useDarkMode from "use-dark-mode";

type Mode = "light" | "dark";

const ANIMATION_PROPERTIES: Record<Mode, SVGProps<SVGCircleElement>> = {
  dark: {
    r: 9,
    transform: "rotate(40deg)",
    cx: 12,
    cy: 4,
    opacity: 0,
  },
  light: {
    r: 5,
    transform: "rotate(90deg)",
    cx: 30,
    cy: 0,
    opacity: 1,
  },
};
const ANIMATION_SPRING_CONFIG = { mass: 4, tension: 250, friction: 35 };
const ICON_SIZE = 24;

export default function ThemeSwitcher() {
  const initialState = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const darkMode = useDarkMode(initialState, {
    classNameDark: "dark",
    classNameLight: "light",
    element: typeof document !== "undefined" ? document.documentElement : undefined,
    storageKey: "exsesx:color-scheme",
  });

  const { r, transform, cx, cy, opacity } = ANIMATION_PROPERTIES[darkMode.value ? "dark" : "light"];

  const svgContainerProps = useSpring({
    to: {
      transform,
    },
    config: ANIMATION_SPRING_CONFIG,
  });
  const centerCircleProps = useSpring({ r, config: ANIMATION_SPRING_CONFIG });
  const maskedCircleProps = useSpring({
    cx,
    cy,
    config: ANIMATION_SPRING_CONFIG,
  });
  const linesProps = useSpring({ opacity, config: ANIMATION_SPRING_CONFIG });

  return (
    <>
      <Head>
        <meta name="msapplication-TileColor" content={darkMode.value ? "#262626" : "#ffffff"} />
        <meta name="theme-color" content={darkMode.value ? "#262626" : "#ffffff"} />
      </Head>
      <animated.svg
        xmlns="http://www.w3.org/2000/svg"
        width={ICON_SIZE}
        height={ICON_SIZE}
        viewBox="0 0 24 24"
        fill="none"
        className="text-gray-800 dark:text-white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        onClick={darkMode.toggle}
        style={{
          cursor: "pointer",
          ...svgContainerProps,
        }}
      >
        <mask id="myMask2">
          <rect x="0" y="0" width="100%" height="100%" className="fill-white" />
          <animated.circle {...maskedCircleProps} r="9" fill="#000" />
        </mask>

        <animated.circle
          className="fill-gray-800 dark:fill-white"
          cx="12"
          cy="12"
          {...centerCircleProps}
          mask="url(#myMask2)"
        />
        <animated.g stroke="currentColor" style={linesProps}>
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </animated.g>
      </animated.svg>
    </>
  );
}
