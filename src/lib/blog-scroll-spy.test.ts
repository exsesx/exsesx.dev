import { describe, expect, test } from "bun:test";
import { resolveActiveHeadingId } from "./blog-scroll-spy";

describe("Blog scroll spy", () => {
  test("tracks the latest heading above the reading line and finishes on the final section", () => {
    expect(
      resolveActiveHeadingId(
        [
          { id: "intro", top: 72 },
          { id: "details", top: 460 },
          { id: "sources", top: 920 },
        ],
        144,
      ),
    ).toBe("intro");

    expect(
      resolveActiveHeadingId(
        [
          { id: "intro", top: -520 },
          { id: "details", top: 112 },
          { id: "sources", top: 610 },
        ],
        144,
      ),
    ).toBe("details");

    expect(
      resolveActiveHeadingId(
        [
          { id: "intro", top: 240 },
          { id: "details", top: 620 },
        ],
        144,
      ),
    ).toBeNull();

    expect(
      resolveActiveHeadingId(
        [
          { id: "intro", top: -900 },
          { id: "sources", top: 380 },
        ],
        144,
        true,
      ),
    ).toBe("sources");
  });
});
