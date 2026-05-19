import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    { name: 'w320', use: { browserName: 'chromium', ...devices['Pixel 5'], viewport: { width: 320, height: 740 } } },
    { name: 'w360', use: { browserName: 'chromium', ...devices['Pixel 5'], viewport: { width: 360, height: 800 } } },
    { name: 'w375', use: { browserName: 'chromium', ...devices['iPhone 12'], viewport: { width: 375, height: 812 } } },
    { name: 'w390', use: { browserName: 'chromium', ...devices['iPhone 12'], viewport: { width: 390, height: 844 } } },
    { name: 'w412', use: { browserName: 'chromium', ...devices['Pixel 5'], viewport: { width: 412, height: 915 } } },
    { name: 'tablet768', use: { browserName: 'chromium', ...devices['iPad (gen 7)'], viewport: { width: 768, height: 1024 } } },
    { name: 'tablet834', use: { browserName: 'chromium', ...devices['iPad Pro 11'], viewport: { width: 834, height: 1112 } } },
  ],
});
