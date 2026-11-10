import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.e2e.ts',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321', channel: 'chrome', ...devices['Desktop Chrome'] },
  webServer: { command: 'node scripts/preview-server.ts', url: 'http://localhost:4321', reuseExistingServer: true },
});
