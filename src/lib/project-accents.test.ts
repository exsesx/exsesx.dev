import { describe, expect, test } from "bun:test";
import { getProjectAccentClasses, PROJECT_ACCENT_CLASSES } from "./project-accents";
import { projects } from "./projects";

describe("project accent classes", () => {
  test("defines every accent used by the project data", () => {
    const usedAccents = [...new Set(projects.map(project => project.accent))].sort();
    const definedAccents = Object.keys(PROJECT_ACCENT_CLASSES).sort();

    for (const accent of usedAccents) {
      expect(definedAccents).toContain(accent);
    }
  });

  test("keeps card and detail hero faces under one accent lookup", () => {
    for (const accent of Object.keys(PROJECT_ACCENT_CLASSES) as Array<keyof typeof PROJECT_ACCENT_CLASSES>) {
      const classes = getProjectAccentClasses(accent);

      expect(typeof classes.gradient).toBe("string");
      expect(typeof classes.topLight).toBe("string");
      expect(typeof classes.card.surface).toBe("string");
      expect(typeof classes.card.mediaShadow).toBe("string");
      expect(typeof classes.detailHero.surface).toBe("string");
    }
  });
});
