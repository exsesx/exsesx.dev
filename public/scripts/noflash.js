// Keep theme and seasonal header treatment ahead of hydration.

(function () {
  // Change these if you use something different in your hook.
  var storageKey = "exsesx:color-scheme";
  var classNameDark = "dark";
  var classNameLight = "light";
  var element = document.documentElement;
  var preferDarkQuery = "(prefers-color-scheme: dark)";
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;

  function getStoredMode() {
    var localStorageTheme = null;
    try {
      localStorageTheme = localStorage.getItem(storageKey);
    } catch {}

    if (localStorageTheme !== null) {
      try {
        localStorageTheme = JSON.parse(localStorageTheme);
      } catch {}

      if (localStorageTheme === true) {
        return "dark";
      }

      if (localStorageTheme === false) {
        return "light";
      }

      if (localStorageTheme === "light" || localStorageTheme === "dark" || localStorageTheme === "system") {
        return localStorageTheme;
      }
    }

    return "system";
  }

  function setClassOnDocumentBody(darkMode, mode) {
    element.classList.add(darkMode ? classNameDark : classNameLight);
    element.classList.remove(darkMode ? classNameLight : classNameDark);
    element.dataset.themeMode = mode;
  }

  function syncFavicon() {
    var isDark = element.classList.contains(classNameDark);
    var href = isDark ? "/favicon/favicon-dark.svg" : "/favicon/favicon-light.svg";
    var iconLinks = Array.prototype.slice.call(document.querySelectorAll("link[rel~='icon']"));

    function setAttribute(link, name, value) {
      if (link.getAttribute(name) !== value) {
        link.setAttribute(name, value);
      }
    }

    function removeAttribute(link, name) {
      if (link.hasAttribute(name)) {
        link.removeAttribute(name);
      }
    }

    if (iconLinks.length === 0) {
      var link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
      iconLinks.push(link);
    }

    iconLinks.forEach(function (link) {
      setAttribute(link, "href", href);
      setAttribute(link, "type", "image/svg+xml");
      removeAttribute(link, "media");
      removeAttribute(link, "sizes");
      link.dataset.managedFavicon = "true";
    });
  }

  function setSeason() {
    var now = new Date();
    var isPrideMonth = now.getMonth() === 5;

    if (isPrideMonth) {
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

    syncFavicon();
  }

  applyTheme();
  setSeason();
  window.setInterval(setSeason, 60 * 60 * 1000);

  window.addEventListener("storage", applyTheme);
  window.addEventListener("exsesx:theme-change", applyTheme);

  if (mql.addEventListener) {
    mql.addEventListener("change", applyTheme);
  } else if (mql.addListener) {
    mql.addListener(applyTheme);
  }

  if ("MutationObserver" in window) {
    var faviconObserver = new MutationObserver(syncFavicon);
    faviconObserver.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "media", "rel", "sizes", "type"],
    });
  }
})();
