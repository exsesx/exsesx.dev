import { describe, expect, test } from "bun:test";
import results from "../../../../public/downloads/cn-benchmark-2026-09-04.json";

describe("cn benchmark evidence", () => {
  test("records five samples per median in the original and verification runs", () => {
    const runs = [
      results.node,
      results.bun,
      results.verification.node,
      results.verification.bun,
      results.verification.longerStable.node,
      results.verification.longerStable.bun,
    ];

    for (const run of runs) {
      expect(run.versions).toEqual({ cn: "0.2.5", clsx: "2.1.1", "tailwind-merge": "3.6.0" });
      for (const result of Object.values(run.results)) {
        for (const library of ["old", "cn"] as const) {
          const samples = result.samples[library];
          expect(samples).toHaveLength(5);
          expect(samples.every(value => Number.isFinite(value) && value > 0)).toBe(true);
          expect(result[`${library}MedianNs`]).toBe([...samples].sort((a, b) => a - b)[2]);
        }
      }
    }
    expect(results.verification.longerStable.node.iterations).toBe(results.node.iterations * 10);
    expect(results.verification.longerStable.bun.warmup).toBe(results.bun.warmup * 10);
  });

  test("both article tables match the rounded original measurements", async () => {
    const expected = [results.node, results.bun].flatMap(run =>
      [run.results.stable, run.results.objects, run.results.unique].map(result => [
        Math.round(result.oldMedianNs),
        Math.round(result.cnMedianNs),
      ]),
    );

    for (const locale of ["en", "uk"]) {
      const source = await Bun.file(new URL(`./${locale}.mdx`, import.meta.url)).text();
      const rows = source
        .split("\n")
        .filter(line => /^\| (Node|Bun)/.test(line))
        .map(line =>
          line
            .split("|")
            .slice(3, 5)
            .map(cell => Number(cell.replace(/\D/g, ""))),
        );
      expect(rows).toEqual(expected);
    }
  });
});
