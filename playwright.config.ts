import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3100", trace: "off", screenshot: "off", video: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run dev -- --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
