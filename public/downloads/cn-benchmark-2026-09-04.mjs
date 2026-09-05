// Run with Node or Bun. Requires cn@0.2.5,
// clsx@2.1.1, and tailwind-merge@3.6.0 in the local node_modules.
// Prints JSON only; does not install packages or write files.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const script = fileURLToPath(import.meta.url);
const versions = {};
for (const [name, expected] of Object.entries({ cn: "0.2.5", clsx: "2.1.1", "tailwind-merge": "3.6.0" })) {
  const entry = require.resolve(name);
  const manifest = JSON.parse(readFileSync(resolve(dirname(entry), "../package.json"), "utf8"));
  assert.equal(manifest.version, expected, `Version mismatch for ${name}`);
  versions[name] = manifest.version;
}

async function load(which) {
  if (which === "cn") return (await import("cn")).cn;
  const { clsx } = await import("clsx");
  const { twMerge } = await import("tailwind-merge");
  return (...inputs) => twMerge(clsx(inputs));
}

const base = "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium";
const variants = Array.from({ length: 16 }, (_, i) => `bg-blue-${((i % 9) + 1) * 100} p-${i}`);
const workloads = {
  stable: merge => merge(base, "bg-blue-500 text-white", "px-6"),
  objects: (merge, i) =>
    merge(base, variants[i % 16], { "opacity-50": i % 2 === 0, "pointer-events-none": i % 3 === 0 }),
  unique: (merge, i) => merge(base, `w-[${i}px]`, "px-6"),
};
const iterations = Number(process.env.CN_BENCH_ITERATIONS ?? 300_000);
const warmup = Number(process.env.CN_BENCH_WARMUP ?? 30_000);
const selectedWorkload = process.env.CN_BENCH_WORKLOAD;
assert(Number.isSafeInteger(iterations) && iterations > 0, "Iterations must be a positive integer");
assert(Number.isSafeInteger(warmup) && warmup > 0, "Warmup must be a positive integer");
assert(!selectedWorkload || Object.hasOwn(workloads, selectedWorkload), "Unknown workload");

if (process.argv[2] === "--worker") {
  const merge = await load(process.argv[3]);
  const run = workloads[process.argv[4]];
  let checksum = 0;
  for (let i = -warmup; i < 0; i++) checksum += run(merge, i + warmup).length;
  const start = performance.now();
  // Unique inputs start beyond the warmup range so the measurement has cache misses.
  for (let i = warmup; i < warmup + iterations; i++) checksum += run(merge, i).length;
  const nanoseconds = ((performance.now() - start) * 1e6) / iterations;
  console.log(JSON.stringify({ nanoseconds, checksum }));
} else {
  const oldMerge = await load("old");
  const newMerge = await load("cn");
  for (const run of Object.values(workloads)) {
    for (let i = 0; i < 1_000; i++) assert.equal(run(newMerge, i), run(oldMerge, i));
  }
  const results = {};
  for (const workload of selectedWorkload ? [selectedWorkload] : Object.keys(workloads)) {
    const samples = { old: [], cn: [] };
    const checksums = [];
    for (let round = 0; round < 5; round++) {
      for (const library of round % 2 === 0 ? ["old", "cn"] : ["cn", "old"]) {
        const child = spawnSync(process.execPath, [script, "--worker", library, workload], { encoding: "utf8" });
        if (child.status !== 0) throw new Error(child.stderr || child.stdout);
        const sample = JSON.parse(child.stdout);
        samples[library].push(sample.nanoseconds);
        checksums.push(sample.checksum);
      }
    }
    assert.equal(new Set(checksums).size, 1);
    const median = values => [...values].sort((a, b) => a - b)[2];
    results[workload] = { samples, oldMedianNs: median(samples.old), cnMedianNs: median(samples.cn) };
  }
  console.log(
    JSON.stringify(
      {
        runtime: process.versions.bun ? `Bun ${process.versions.bun}` : `Node ${process.version}`,
        platform: process.platform,
        arch: process.arch,
        versions,
        iterations,
        warmup,
        rounds: 5,
        results,
      },
      null,
      2,
    ),
  );
}
