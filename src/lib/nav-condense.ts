export const NAV_CONDENSE_AFTER = 72;
export const NAV_EXPAND_BELOW = 32;

export function resolveNavCondensed(scrollY: number, wasCondensed: boolean): boolean {
  return wasCondensed ? scrollY > NAV_EXPAND_BELOW : scrollY > NAV_CONDENSE_AFTER;
}

export function attachNavCondense(element: HTMLElement): () => void {
  let condensed = resolveNavCondensed(window.scrollY, false);

  element.dataset.condensed = String(condensed);

  function handleScroll() {
    const next = resolveNavCondensed(window.scrollY, condensed);

    if (next !== condensed) {
      condensed = next;
      element.dataset.condensed = String(next);
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", handleScroll);
    delete element.dataset.condensed;
  };
}
