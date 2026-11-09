import { MOTION_DATASET_KEYS, MOTION_OFF } from "./motion-contract";
import { MOTION_STORAGE_KEY } from "./motion-preference";

/*
 * Base UI's Drawer registers these with CSS.registerProperty on its first open
 * (DrawerPopup's removeCSSVariableInheritance), and each registration makes
 * Chrome restyle the whole document: about 1,800 elements and 35ms of a 4x
 * slowed phone, inside the tap that opens the table of contents. Registered
 * here, before <body> exists, they cost nothing, and the Drawer's own calls
 * throw and are ignored. The descriptors match Base UI's.
 */
export const DRAWER_SWIPE_PROPERTIES: PropertyDefinition[] = [
  { name: "--drawer-swipe-movement-x", syntax: "<length>", inherits: false, initialValue: "0px" },
  { name: "--drawer-swipe-movement-y", syntax: "<length>", inherits: false, initialValue: "0px" },
  { name: "--drawer-snap-point-offset", syntax: "<length>", inherits: false, initialValue: "0px" },
  { name: "--drawer-swipe-progress", syntax: "<number>", inherits: false, initialValue: "0" },
  { name: "--drawer-swipe-strength", syntax: "<number>", inherits: false, initialValue: "1" },
];

type NoFlashMotion = {
  storageKey: string;
  datasetKey: string;
  off: string;
};

// Serialized into the page via Function.prototype.toString() (see
// createNoFlashScript below) — the function must stay self-contained: no
// imports, no module-scope references, only globals. Anything closed over
// serializes as an undefined identifier in the inline script and fails at
// runtime in the browser, not at build time. Comments are stripped in prod
// but ship in dev, so never write `</script>` in one.
function noFlashScript(
  themeColorDark: string,
  themeColorLight: string,
  motion: NoFlashMotion,
  registeredProperties: PropertyDefinition[],
) {
  var storageKey = "exsesx:color-scheme";
  var classNameDark = "dark";
  var classNameLight = "light";
  var currentThemeColor = themeColorLight;
  var element = document.documentElement;
  var preferDarkQuery = "(prefers-color-scheme: dark)";
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;
  var themeColorMeta: HTMLMetaElement | null = null;
  var sampleRefreshFrame = 0;

  // A color-only change does not invalidate Safari 26's cached fixed edge.
  // Pulse the paintless candidate from 11px to 12px for one painted frame so
  // its eligible border box changes without exposing a band at the top edge.
  function refreshSafariChromeSample() {
    window.cancelAnimationFrame(sampleRefreshFrame);
    element.dataset.chromeSampleRefresh = "";
    sampleRefreshFrame = window.requestAnimationFrame(() => {
      sampleRefreshFrame = window.requestAnimationFrame(() => {
        delete element.dataset.chromeSampleRefresh;
        sampleRefreshFrame = 0;
      });
    });
  }

  // Own the theme-color meta instead of touching React's: React hoists head
  // metas and mutating one it tracks breaks its deletion pass on navigation.
  function syncThemeColorMeta() {
    if (themeColorMeta === null || !themeColorMeta.isConnected) {
      themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-exsesx-theme-color]');
    }

    if (themeColorMeta === null) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.setAttribute("name", "theme-color");
      themeColorMeta.setAttribute("data-exsesx-theme-color", "");
      document.head.appendChild(themeColorMeta);
    }

    if (themeColorMeta.content !== currentThemeColor) {
      themeColorMeta.content = currentThemeColor;
    }
  }

  // Safari 26 samples actual rendered background colors for its chrome. This
  // script runs in <head>, before <body> and the fixed header are parsed, so the
  // document starts with the resolved theme color instead of first painting cream.
  function paintSafariChrome(darkMode: boolean) {
    var color = darkMode ? themeColorDark : themeColorLight;
    var scheme = darkMode ? "dark" : "light";

    currentThemeColor = color;
    element.style.setProperty("--background", color);
    element.style.setProperty("--safari-chrome-color", color);
    element.style.backgroundColor = color;
    element.style.colorScheme = scheme;
    syncThemeColorMeta();
    refreshSafariChromeSample();
  }

  function getStoredMode() {
    var localStorageTheme = null;

    try {
      localStorageTheme = localStorage.getItem(storageKey);
    } catch {}

    if (localStorageTheme !== null) {
      try {
        localStorageTheme = JSON.parse(localStorageTheme);
      } catch {}

      if (localStorageTheme === true) return "dark";
      if (localStorageTheme === false) return "light";
      if (localStorageTheme === "light" || localStorageTheme === "dark" || localStorageTheme === "system") {
        return localStorageTheme;
      }
    }

    return "system";
  }

  function setClassOnDocumentBody(darkMode: boolean, mode: string) {
    element.classList.add(darkMode ? classNameDark : classNameLight);
    element.classList.remove(darkMode ? classNameLight : classNameDark);
    element.dataset.themeMode = mode;
    paintSafariChrome(darkMode);
  }

  function setSeason() {
    var now = new Date();

    if (now.getMonth() === 5) {
      element.dataset.season = "pride";
    } else {
      delete element.dataset.season;
    }
  }

  function applyTheme() {
    var mode = getStoredMode();

    if (mode === "dark") {
      setClassOnDocumentBody(true, mode);
    } else if (mode === "light") {
      setClassOnDocumentBody(false, mode);
    } else if (supportsColorSchemeQuery) {
      setClassOnDocumentBody(mql.matches, mode);
    } else {
      setClassOnDocumentBody(element.classList.contains(classNameDark), mode);
    }
  }

  // Motion off reads as prefers-reduced-motion in CSS, so it must be on the
  // root before the first paint or the entrance animations would start.
  // setMotionEnabled updates it in place; this covers load and other tabs.
  function applyMotion() {
    var motionOff = false;

    try {
      motionOff = localStorage.getItem(motion.storageKey) === "false";
    } catch {}

    if (motionOff) {
      element.dataset[motion.datasetKey] = motion.off;
    } else {
      delete element.dataset[motion.datasetKey];
    }
  }

  function registerProperties() {
    if (typeof CSS === "undefined" || typeof CSS.registerProperty !== "function") {
      return;
    }

    registeredProperties.forEach(definition => {
      try {
        CSS.registerProperty(definition);
      } catch {}
    });
  }

  applyTheme();
  applyMotion();
  registerProperties();

  setSeason();
  window.setInterval(setSeason, 60 * 60 * 1000);
  window.addEventListener("storage", applyTheme);
  window.addEventListener("storage", applyMotion);
  window.addEventListener("exsesx:theme-change", applyTheme);
  window.addEventListener("pageshow", refreshSafariChromeSample);

  if (mql.addEventListener) {
    mql.addEventListener("change", applyTheme);
  } else if (mql.addListener) {
    mql.addListener(applyTheme);
  }
}

export function createNoFlashScript(themeColorDark: string, themeColorLight: string) {
  const motion: NoFlashMotion = {
    storageKey: MOTION_STORAGE_KEY,
    datasetKey: MOTION_DATASET_KEYS.motion,
    off: MOTION_OFF,
  };
  const args = [themeColorDark, themeColorLight, motion, DRAWER_SWIPE_PROPERTIES].map(value => JSON.stringify(value));

  return `(${noFlashScript.toString()})(${args.join(", ")});`;
}
