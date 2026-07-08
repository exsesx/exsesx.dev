import { describe, expect, test } from "bun:test";
import { getPrimaryNavHref, isProjectDetailPath, isProjectsIndexRoutePath } from "./routes";

describe("route classification", () => {
  test("classifies every projects-shaped pathname as the projects nav item", () => {
    expect(getPrimaryNavHref("/projects")).toBe("/projects");
    expect(getPrimaryNavHref("/projects/archive")).toBe("/projects");
    expect(getPrimaryNavHref("/project/quicklizard")).toBe("/projects");
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
});
