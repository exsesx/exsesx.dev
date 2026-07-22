import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const MOBILE_SAFARI_SPEC = /mobile-safari\.spec\.ts/;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  outputDir: join(tmpdir(), "exsesx-dev-playwright-results"),
  use: {
    baseURL: "http://127.0.0.1:3010",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: MOBILE_SAFARI_SPEC,
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 900 },
        hasTouch: false,
        isMobile: false,
      },
    },
    {
      name: "mobile-chromium",
      testIgnore: MOBILE_SAFARI_SPEC,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "mobile-webkit-iphone-17-pro",
      testMatch: MOBILE_SAFARI_SPEC,
      use: {
        ...devices["iPhone 17 Pro"],
      },
    },
  ],
  webServer: {
    command: "bun run start -- -H 127.0.0.1 -p 3010",
    url: "http://127.0.0.1:3010",
    reuseExistingServer: false,
  },
});
