import { BLOG_HEADER_HIDE_AFTER } from "./blog-focus";

export const BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE = "blogFocusBootstrap";
export const BLOG_FOCUS_BOOTSTRAP_EVENT = "exsesx:blog-focus-bootstrap";

// Serialized into the page with Function.prototype.toString(), so this must
// remain self-contained. Every value it needs is passed as an argument.
function blogFocusBootstrap(headerHideAfter: number, datasetKey: string, eventName: string) {
  var element = document.documentElement;
  var pathParts = window.location.pathname.split("/").filter(Boolean);
  var isBlogArticle = pathParts.length === 3 && pathParts[0] === "blog";

  if (!isBlogArticle) {
    delete element.dataset[datasetKey];
    return;
  }

  element.dataset[datasetKey] = "pending";

  function resolveHeaderState() {
    var scrollY = Math.max(0, window.scrollY);
    var startsPastHidePoint = scrollY >= headerHideAfter;

    element.dataset[datasetKey] = startsPastHidePoint ? "hidden" : "visible";
    window.dispatchEvent(new Event(eventName));
  }

  function scheduleResolution() {
    window.requestAnimationFrame(resolveHeaderState);
  }

  function handlePageShow(event: PageTransitionEvent) {
    if (!event.persisted) {
      return;
    }

    element.dataset[datasetKey] = "pending";
    scheduleResolution();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleResolution, { once: true });
  } else {
    scheduleResolution();
  }

  window.addEventListener("pageshow", handlePageShow);
}

export function createBlogFocusBootstrapScript(headerHideAfter = BLOG_HEADER_HIDE_AFTER) {
  return `(${blogFocusBootstrap.toString()})(${JSON.stringify(headerHideAfter)}, ${JSON.stringify(BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE)}, ${JSON.stringify(BLOG_FOCUS_BOOTSTRAP_EVENT)});`;
}
