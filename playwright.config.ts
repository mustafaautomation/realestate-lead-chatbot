import { defineConfig } from "@playwright/test";

const port = 47311;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI ? `npx next start -H 127.0.0.1 -p ${port}` : `npx next dev -H 127.0.0.1 -p ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } }, testIgnore: /mobile/ },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } }, testMatch: /mobile/ },
  ],
});
