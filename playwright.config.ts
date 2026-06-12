import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retry flaky tests due to occasional React Router timing issues
  retries: 2,
  // Use single worker to avoid flaky tests with Vite dev server
  // Multiple workers can cause React Router state issues under load
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
    // Increase action timeout for slower React re-renders
    actionTimeout: 10000,
  },
  // Increase default expect timeout
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun run dev -- --port 5174",
    url: "http://localhost:5174",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
