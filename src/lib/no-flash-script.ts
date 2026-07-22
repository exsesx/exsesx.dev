// Serialized into the page via Function.prototype.toString() (see
// createNoFlashScript below) — the function must stay self-contained: no
// imports, no module-scope references, only globals. Anything closed over
// serializes as an undefined identifier in the inline script and fails at
// runtime in the browser, not at build time. Comments are stripped in prod
// but ship in dev, so never write `</script>` in one.
function noFlashScript(themeColorDark: string, themeColorLight: string) {
  var storageKey = "exsesx:color-scheme";
  var classNameDark = "dark";
  var classNameLight = "light";
  var currentThemeColor = themeColorLight;
  var element = document.documentElement;
  var preferDarkQuery = "(prefers-color-scheme: dark)";
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;
  var themeColorMeta: HTMLMetaElement | null = null;
  var sampleBandTimer = 0;

  // Safari 26 keeps a sampled chrome color after the sampled element disappears
  // (found on device 2026-06-11), so the solid band in .site-header only needs
  // to exist around repaints: flash html[data-chrome-sample] for ~1s on first
  // paint and every theme change, then drop it. CSS consumes this signal only
  // on coarse touch WebKit so desktop browsers never paint the sampling band.
  // See html[data-chrome-sample] in globals.css.
  function flashChromeSampleBand() {
    window.clearTimeout(sampleBandTimer);
    element.dataset.chromeSample = "";
    sampleBandTimer = window.setTimeout(() => {
      delete element.dataset.chromeSample;
    }, 1000);
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
    flashChromeSampleBand();
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

  applyTheme();

  // Chromium is the only engine that renders SVG filter references inside
  // backdrop-filter; everywhere else the whole backdrop-filter would be
  // dropped. navigator.userAgentData exists only in Chromium, so gate the
  // liquid-lens refraction behind it and let Safari/Firefox keep frosted glass.
  var chromiumNavigator = navigator as Navigator & { userAgentData?: unknown };

  if (chromiumNavigator.userAgentData) {
    element.classList.add("glass-lens");
  }

  setSeason();
  window.setInterval(setSeason, 60 * 60 * 1000);
  window.addEventListener("storage", applyTheme);
  window.addEventListener("exsesx:theme-change", applyTheme);
  // The head-run flash above can expire before a slow first paint, and bfcache
  // restores reset the chrome — pageshow covers both.
  window.addEventListener("pageshow", flashChromeSampleBand);

  if (mql.addEventListener) {
    mql.addEventListener("change", applyTheme);
  } else if (mql.addListener) {
    mql.addListener(applyTheme);
  }
}

export function createNoFlashScript(themeColorDark: string, themeColorLight: string) {
  return `(${noFlashScript.toString()})(${JSON.stringify(themeColorDark)}, ${JSON.stringify(themeColorLight)});`;
}
