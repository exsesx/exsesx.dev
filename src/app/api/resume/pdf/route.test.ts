import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createPatchedFetcher, NEXT_PATCH_SYMBOL } from "next/dist/server/lib/patch-fetch";
import { GET } from "./route";

const pdf = "%PDF-1.7\nfixture";
const requestUrl = "https://site.invalid/api/resume/pdf";
const originalFetch = globalThis.fetch;
const originalPatch = Object.getOwnPropertyDescriptor(globalThis, NEXT_PATCH_SYMBOL);
const originalEnvironment = {
  RXRESUME_API_KEY: process.env.RXRESUME_API_KEY,
  RXRESUME_BASE_URL: process.env.RXRESUME_BASE_URL,
  RXRESUME_RESUME_ID: process.env.RXRESUME_RESUME_ID,
};

// Exercise Next's real cache policy and stream tee with a minimal request store and in-memory persistence.
function installUpstream(reply: () => Promise<Response>) {
  const upstream = mock(reply);
  let entry: unknown = null;
  const store = {
    route: "/api/resume/pdf",
    pendingRevalidates: {} as Record<string, Promise<unknown>>,
    incrementalCache: {
      generateCacheKey: async () => "resume-fixture",
      lock: async () => () => {},
      get: async () => entry,
      set: async (_key: string, value: unknown) => {
        entry = { value, isStale: false };
      },
    },
  };

  globalThis.fetch = createPatchedFetcher(Object.assign(upstream, { preconnect: originalFetch.preconnect }), {
    workAsyncStorage: { getStore: () => store },
    workUnitAsyncStorage: { getStore: () => undefined },
  } as unknown as Parameters<typeof createPatchedFetcher>[1]);

  return { upstream, flushCache: () => Promise.all(Object.values(store.pendingRevalidates)) };
}

beforeEach(() => {
  process.env.RXRESUME_API_KEY = "resume-test-key";
  process.env.RXRESUME_BASE_URL = "https://resume.invalid";
  process.env.RXRESUME_RESUME_ID = "resume-test-id";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalPatch) {
    Object.defineProperty(globalThis, NEXT_PATCH_SYMBOL, originalPatch);
  } else {
    Reflect.deleteProperty(globalThis, NEXT_PATCH_SYMBOL);
  }
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("resume PDF route", () => {
  test("retries the upstream after an invalid HTTP 200 instead of caching the failure", async () => {
    let calls = 0;
    const { upstream, flushCache } = installUpstream(async () => {
      calls += 1;
      return new Response(calls === 1 ? "upstream error document" : pdf);
    });

    const failed = await GET(new Request(requestUrl));
    expect(failed.status).toBe(502);
    expect(failed.headers.get("Cache-Control")).toBe("no-store");
    await flushCache();

    const recovered = await GET(new Request(requestUrl));
    expect(recovered.status).toBe(200);
    expect(await recovered.text()).toBe(pdf);
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  test.each(["declared", "streamed"])("cancels an oversized PDF with a %s size", async size => {
    let emittedBytes = 0;
    let cancelled = false;
    const totalBytes = 16 * 1024 * 1024;
    const { flushCache } = installUpstream(async () => {
      const body = new ReadableStream<Uint8Array>({
        pull(controller) {
          const chunk = new Uint8Array(1024 * 1024);
          emittedBytes += chunk.byteLength;
          controller.enqueue(chunk);
          if (emittedBytes === totalBytes) controller.close();
        },
        cancel() {
          cancelled = true;
        },
      });
      return new Response(body, {
        headers: size === "declared" ? { "Content-Length": String(totalBytes) } : undefined,
      });
    });

    const response = await GET(new Request(requestUrl));
    await flushCache();

    expect(response.status).toBe(502);
    expect(cancelled).toBe(true);
    expect(emittedBytes).toBeLessThan(totalBytes);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  test.each([
    ["inline", ""],
    ["attachment", "?download=1"],
  ])("serves a validated PDF with the %s disposition", async (disposition, query) => {
    installUpstream(async () => new Response(pdf));
    const response = await GET(new Request(`${requestUrl}${query}`));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(pdf);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Length")).toBe(String(pdf.length));
    expect(response.headers.get("Content-Disposition")).toBe(`${disposition}; filename="Oleh Vanin CV.pdf"`);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
    );
  });

  test.each([302, 503])("returns a sanitized, uncached error for upstream status %d", async status => {
    installUpstream(async () => new Response("private upstream details", { status }));
    const response = await GET(new Request(requestUrl));

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Unable to fetch the latest resume PDF" });
  });

  test("returns a sanitized, uncached error when fetching throws", async () => {
    installUpstream(async () => {
      throw new Error("private upstream details");
    });
    const response = await GET(new Request(requestUrl));

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Unable to fetch the latest resume PDF" });
  });

  test("does not fetch without an API key", async () => {
    const { upstream } = installUpstream(async () => new Response(pdf));
    delete process.env.RXRESUME_API_KEY;
    const response = await GET(new Request(requestUrl));

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(upstream).not.toHaveBeenCalled();
  });
});
