import { defineConfig, devices } from "@playwright/test";

const PORT = 3010;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      'powershell -Command "$env:NEXT_PUBLIC_USE_MOCK=\'true\'; if (Test-Path .next) { Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue }; npx next dev -p 3010"',
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
