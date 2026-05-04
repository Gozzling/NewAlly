import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', channel: 'chromium' },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});