import { defineConfig, devices } from '@playwright/test';

/**
 * T11.3 — Playwright configuration for end-to-end testing.
 *
 * Provides E2E testing with:
 * - Multiple browser support (Chromium, Firefox, WebKit)
 * - Mobile device emulation
 * - Screenshot and video capture on failure
 * - Parallel test execution
 * - Retry on failure
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Tablet viewports
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'npm run start:dev',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
