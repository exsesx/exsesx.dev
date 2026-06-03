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
    var seasonalHrefDark = "/favicon/favicon-pride-dark.svg?v=pride-2026";
    var seasonalHrefLight = "/favicon/favicon-pride-light.svg?v=pride-2026";
    var seasonalHref32Dark = "/favicon/favicon-pride-dark-32x32.png?v=pride-2026";
    var seasonalHref32Light = "/favicon/favicon-pride-light-32x32.png?v=pride-2026";
    var seasonalHref16Dark = "/favicon/favicon-pride-dark-16x16.png?v=pride-2026";
    var seasonalHref16Light = "/favicon/favicon-pride-light-16x16.png?v=pride-2026";
    var seasonalAppleHrefDark = "/favicon/apple-touch-icon-pride-dark.png?v=pride-2026";
    var seasonalAppleHrefLight = "/favicon/apple-touch-icon-pride-light.png?v=pride-2026";
    var iconLinks = Array.prototype.slice.call(
      document.querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon']"),
    );
    var isDarkResolved = element.classList.contains(classNameDark);

    if (isPrideMonth) {
      element.dataset.season = "pride";
    } else {
      delete element.dataset.season;
    }

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

      setAttribute(link, "href", link.dataset.defaultHref);

      if (link.dataset.defaultType) {
        setAttribute(link, "type", link.dataset.defaultType);
      } else {
        removeAttribute(link, "type");
      }

      if (link.dataset.defaultMedia) {
        setAttribute(link, "media", link.dataset.defaultMedia);
      } else {
        removeAttribute(link, "media");
      }

      if (link.dataset.defaultSizes) {
        setAttribute(link, "sizes", link.dataset.defaultSizes);
      } else {
        removeAttribute(link, "sizes");
      }
    }

    function contrastHref(darkTileHref, lightTileHref) {
      return isDarkResolved ? lightTileHref : darkTileHref;
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
        if (link.getAttribute("rel") === "apple-touch-icon") {
          setAttribute(link, "href", contrastHref(seasonalAppleHrefDark, seasonalAppleHrefLight));
          setAttribute(link, "sizes", "180x180");
          removeAttribute(link, "media");
          removeAttribute(link, "type");

          return;
        }

        var sizes = link.dataset.defaultSizes || link.getAttribute("sizes") || "";
        var media = link.dataset.defaultMedia || link.getAttribute("media") || "";
        var href = contrastHref(seasonalHrefDark, seasonalHrefLight);
        var type = "image/svg+xml";

        if (sizes === "32x32") {
          href = contrastHref(seasonalHref32Dark, seasonalHref32Light);
          type = "image/png";
        } else if (sizes === "16x16") {
          href = contrastHref(seasonalHref16Dark, seasonalHref16Light);
          type = "image/png";
        } else if (media.indexOf("prefers-color-scheme: light") !== -1) {
          href = seasonalHrefDark;
        } else if (media.indexOf("prefers-color-scheme: dark") !== -1) {
          href = seasonalHrefLight;
        }

        setAttribute(link, "href", href);
        setAttribute(link, "type", type);

        if (media && sizes !== "32x32" && sizes !== "16x16") {
          setAttribute(link, "media", media);
        } else {
          removeAttribute(link, "media");
        }

        if (sizes === "32x32" || sizes === "16x16") {
          setAttribute(link, "sizes", sizes);
        } else {
          removeAttribute(link, "sizes");
        }

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

  if ("MutationObserver" in window) {
    var faviconObserver = new MutationObserver(setSeasonalFavicon);
    faviconObserver.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "media", "rel", "sizes", "type"],
    });

    var themeObserver = new MutationObserver(setSeasonalFavicon);
    themeObserver.observe(element, {
      attributes: true,
      attributeFilter: ["class", "data-theme-mode"],
    });
  }
})();
