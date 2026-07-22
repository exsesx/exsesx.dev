import { describe, expect, test } from "bun:test";
import { shouldScrollToTopForNavClick } from "./nav-scroll";

describe("shouldScrollToTopForNavClick", () => {
  test("scrolls to top when clicking the current home route below the top", () => {
    expect(shouldScrollToTopForNavClick({ pathname: "/", href: "/", scrollY: 24 })).toBe(true);
  });

  test("scrolls to top when clicking the current projects route below the top", () => {
    expect(shouldScrollToTopForNavClick({ pathname: "/projects", href: "/projects", scrollY: 24 })).toBe(true);
  });

  test("scrolls to top when clicking the current Blog route below the top", () => {
    expect(shouldScrollToTopForNavClick({ pathname: "/blog/en", href: "/blog/en", scrollY: 24 })).toBe(true);
  });

  test("does not intercept clicks at the top of the current route", () => {
    expect(shouldScrollToTopForNavClick({ pathname: "/", href: "/", scrollY: 0 })).toBe(false);
  });

  test("does not intercept navigation to a different route", () => {
    expect(shouldScrollToTopForNavClick({ pathname: "/project/flowkit", href: "/projects", scrollY: 24 })).toBe(false);
  });
});
