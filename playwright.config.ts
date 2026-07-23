import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const MOBILE_SAFARI_SPEC = /mobile-safari\.spec\.ts/;
const DESKTOP_ONLY = /@desktop-only/;
const MOBILE_ONLY = /@mobile-only/;
const BASE_URL = "http://127.0.0.1:3010";
const IS_CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: IS_CI ? 2 : "50%",
  forbidOnly: IS_CI,
  reporter: "line",
  outputDir: join(tmpdir(), "exsesx-dev-playwright-results"),
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: MOBILE_SAFARI_SPEC,
      grepInvert: MOBILE_ONLY,
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
      grepInvert: DESKTOP_ONLY,
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
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
  },
});
