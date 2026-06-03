// Keep theme and seasonal favicon decisions ahead of hydration.

(function () {
  // Change these if you use something different in your hook.
  var storageKey = "exsesx:color-scheme";
  var classNameDark = "dark";
  var classNameLight = "light";
  var element = document.documentElement;

  function setClassOnDocumentBody(darkMode, mode) {
    element.classList.add(darkMode ? classNameDark : classNameLight);
    element.classList.remove(darkMode ? classNameLight : classNameDark);
    element.dataset.themeMode = mode;
  }

  function setSeasonalFavicon() {
    var now = new Date();
    var isPrideMonth = now.getMonth() === 5;
    var seasonalHref = "/favicon/favicon-pride.svg?v=pride-2026";
    var iconLinks = Array.prototype.slice.call(document.querySelectorAll("link[rel~='icon']"));

    function rememberDefault(link) {
      if (!("defaultHref" in link.dataset)) {
        link.dataset.defaultHref = link.getAttribute("href") || "";
      }

      if (!("defaultType" in link.dataset)) {
        link.dataset.defaultType = link.getAttribute("type") || "";
      }

      if (!("defaultMedia" in link.dataset)) {
        link.dataset.defaultMedia = link.getAttribute("media") || "";
      }

      if (!("defaultSizes" in link.dataset)) {
        link.dataset.defaultSizes = link.getAttribute("sizes") || "";
      }
    }

    function restoreDefault(link) {
      if (!link.dataset.defaultHref) {
        return;
      }

      link.setAttribute("href", link.dataset.defaultHref);

      if (link.dataset.defaultType) {
        link.setAttribute("type", link.dataset.defaultType);
      } else {
        link.removeAttribute("type");
      }

      if (link.dataset.defaultMedia) {
        link.setAttribute("media", link.dataset.defaultMedia);
      } else {
        link.removeAttribute("media");
      }

      if (link.dataset.defaultSizes) {
        link.setAttribute("sizes", link.dataset.defaultSizes);
      } else {
        link.removeAttribute("sizes");
      }
    }

    if (iconLinks.length === 0) {
      var link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
      iconLinks.push(link);
    }

    iconLinks.forEach(function (link) {
      rememberDefault(link);

      if (isPrideMonth) {
        link.setAttribute("href", seasonalHref);
        link.setAttribute("type", "image/svg+xml");
        link.removeAttribute("media");
        link.removeAttribute("sizes");

        return;
      }

      restoreDefault(link);
    });
  }

  var preferDarkQuery = "(prefers-color-scheme: dark)";
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;
  var localStorageTheme = null;
  try {
    localStorageTheme = localStorage.getItem(storageKey);
  } catch {}
  var mode = "system";
  if (localStorageTheme !== null) {
    try {
      localStorageTheme = JSON.parse(localStorageTheme);
    } catch {}

    if (localStorageTheme === true) {
      mode = "dark";
    } else if (localStorageTheme === false) {
      mode = "light";
    } else if (localStorageTheme === "light" || localStorageTheme === "dark" || localStorageTheme === "system") {
      mode = localStorageTheme;
    }
  }

  if (mode === "dark") {
    setClassOnDocumentBody(true, mode);
  } else if (mode === "light") {
    setClassOnDocumentBody(false, mode);
  } else if (supportsColorSchemeQuery) {
    setClassOnDocumentBody(mql.matches, mode);
  } else {
    setClassOnDocumentBody(element.classList.contains(classNameDark), mode);
  }

  setSeasonalFavicon();
  window.setInterval(setSeasonalFavicon, 60 * 60 * 1000);
})();
