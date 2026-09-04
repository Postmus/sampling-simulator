import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5181",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1366, height: 768 },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5181",
    url: "http://127.0.0.1:5181",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
