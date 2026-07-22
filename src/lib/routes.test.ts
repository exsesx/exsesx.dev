import { describe, expect, test } from "bun:test";
import {
  getAdjacentPrimaryNavHref,
  getPrimaryNavHref,
  isBlogIndexRoutePath,
  isBlogPostPath,
  isProjectDetailPath,
  isProjectsIndexRoutePath,
} from "./routes";

describe("route classification", () => {
  test("classifies every projects-shaped pathname as the projects nav item", () => {
    expect(getPrimaryNavHref("/projects")).toBe("/projects");
    expect(getPrimaryNavHref("/projects/archive")).toBe("/projects");
    expect(getPrimaryNavHref("/project/quicklizard")).toBe("/projects");
  });

  test("classifies Blog indexes and posts as the Blog nav item", () => {
    expect(getPrimaryNavHref("/blog")).toBe("/blog/en");
    expect(getPrimaryNavHref("/blog/en")).toBe("/blog/en");
    expect(getPrimaryNavHref("/blog/en/codex-agents-v2")).toBe("/blog/en");
    expect(getPrimaryNavHref("/blog/uk/codex-agents-v2")).toBe("/blog/en");
  });

  test("cycles through Home, Projects, and Blog in both directions", () => {
    expect(getAdjacentPrimaryNavHref("/", "right")).toBe("/projects");
    expect(getAdjacentPrimaryNavHref("/projects", "right")).toBe("/blog/en");
    expect(getAdjacentPrimaryNavHref("/blog/uk/codex-agents-v2", "right")).toBe("/");
    expect(getAdjacentPrimaryNavHref("/", "left")).toBe("/blog/en");
  });

  test("classifies non-project pathnames as home", () => {
    expect(getPrimaryNavHref("/")).toBe("/");
    expect(getPrimaryNavHref("/now")).toBe("/");
  });

  test("recognizes project detail routes", () => {
    expect(isProjectDetailPath("/project/quicklizard")).toBe(true);
    expect(isProjectDetailPath("/projects")).toBe(false);
    expect(isProjectDetailPath("/projects/quicklizard")).toBe(false);
  });

  test("recognizes the projects index route even with search or hash", () => {
    expect(isProjectsIndexRoutePath("/projects")).toBe(true);
    expect(isProjectsIndexRoutePath("/projects?filter=ai")).toBe(true);
    expect(isProjectsIndexRoutePath("/projects#selected")).toBe(true);
    expect(isProjectsIndexRoutePath("/projects/archive")).toBe(false);
    expect(isProjectsIndexRoutePath("/project/quicklizard")).toBe(false);
  });

  test("distinguishes localized Blog indexes from article routes", () => {
    expect(isBlogIndexRoutePath("/blog/en")).toBe(true);
    expect(isBlogIndexRoutePath("/blog/uk?from=nav")).toBe(true);
    expect(isBlogIndexRoutePath("/blog/en/codex-agents-v2")).toBe(false);
    expect(isBlogPostPath("/blog/en/codex-agents-v2")).toBe(true);
    expect(isBlogPostPath("/blog/uk/codex-agents-v2")).toBe(true);
    expect(isBlogPostPath("/blog/en")).toBe(false);
    expect(isBlogPostPath("/blog/ua/not-a-language-route")).toBe(false);
    expect(isBlogIndexRoutePath("/blog/ua")).toBe(false);
  });
});
