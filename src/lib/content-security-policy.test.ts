import { describe, expect, test } from "bun:test";
import { buildContentSecurityPolicy } from "./content-security-policy.mts";

function directiveTokens(policy: string, directiveName: string) {
  const directive = policy.split("; ").find(value => value.startsWith(`${directiveName} `));

  if (!directive) {
    throw new Error(`Missing ${directiveName} directive`);
  }

  return directive.split(" ").slice(1);
}

function expectNoUmamiOrigin(policy: string) {
  for (const directive of policy.split("; ")) {
    expect(directive.split(" ")).not.toContain("https://cloud.umami.is");
  }
}

describe("content security policy", () => {
  test("allows the exact Umami origin once in production script and connection sources", () => {
    const policy = buildContentSecurityPolicy({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    });

    expect(directiveTokens(policy, "script-src")).toEqual(["'self'", "'unsafe-inline'", "https://cloud.umami.is"]);
    expect(directiveTokens(policy, "connect-src")).toEqual(["'self'", "https://cloud.umami.is"]);
  });

  test("preserves preview sources without allowing Umami", () => {
    const policy = buildContentSecurityPolicy({
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
    });

    expect(directiveTokens(policy, "img-src")).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://vercel.live",
      "https://vercel.com",
    ]);
    expect(directiveTokens(policy, "connect-src")).toEqual([
      "'self'",
      "https://vercel.live",
      "wss://ws-us3.pusher.com",
    ]);
    expect(directiveTokens(policy, "script-src")).toContain("https://vercel.live");
    expect(directiveTokens(policy, "style-src")).toContain("https://vercel.live");
    expect(directiveTokens(policy, "frame-src")).toEqual(["https://vercel.live"]);
    expectNoUmamiOrigin(policy);
  });

  test("preserves unsafe eval in development without allowing Umami", () => {
    const policy = buildContentSecurityPolicy({ NODE_ENV: "development" });

    expect(directiveTokens(policy, "script-src")).toContain("'unsafe-eval'");
    expectNoUmamiOrigin(policy);
  });

  test("does not allow Umami for a non-Vercel production build", () => {
    const policy = buildContentSecurityPolicy({ NODE_ENV: "production" });

    expectNoUmamiOrigin(policy);
  });

  test("keeps the security floor in every environment", () => {
    const policies = [
      buildContentSecurityPolicy({ NODE_ENV: "production", VERCEL_ENV: "production" }),
      buildContentSecurityPolicy({ NODE_ENV: "production", VERCEL_ENV: "preview" }),
      buildContentSecurityPolicy({ NODE_ENV: "development" }),
      buildContentSecurityPolicy({ NODE_ENV: "production" }),
    ];

    for (const policy of policies) {
      expect(policy.split("; ")).toContain("default-src 'self'");
      expect(policy.split("; ")).toContain("object-src 'none'");
      expect(policy.split("; ")).toContain("frame-ancestors 'none'");
      expect(policy.split(/; | /)).not.toContain("*");
    }
  });
});
