import { describe, expect, test } from "bun:test";
import { cn } from "./utils";

describe("cn", () => {
  test("combines conditional class values", () => {
    expect(cn("px-2", false, ["py-1", { block: true, hidden: false }])).toBe("px-2 py-1 block");
  });

  test("lets consumer classes override conflicting defaults", () => {
    expect(cn("rounded-md p-2 text-red-500", "p-4 text-blue-500 custom-class")).toBe(
      "rounded-md p-4 text-blue-500 custom-class",
    );
  });

  test("merges modifier and arbitrary-variant conflicts", () => {
    expect(cn("hover:bg-red-500 data-[state=open]:opacity-50", "hover:bg-blue-500 data-[state=open]:opacity-100")).toBe(
      "hover:bg-blue-500 data-[state=open]:opacity-100",
    );
  });
});
