import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: process.env.E2E_LIVE_API ? "live.spec.ts" : "auth.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  use: { baseURL: "http://localhost:3002", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run dev -- --port 3002", url: "http://localhost:3002", reuseExistingServer: false, timeout: 120000, env: { NEXT_PUBLIC_API_URL: process.env.E2E_LIVE_API || "http://localhost:5000" } }
});
