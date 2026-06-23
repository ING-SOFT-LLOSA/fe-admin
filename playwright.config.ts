import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/__tests__/e2e',
  timeout: 120_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    // IMPORTANT: Use PLAYWRIGHT_BASE_URL, not NEXT_PUBLIC_API_URL_LLOSA.
    // NEXT_PUBLIC_API_URL_LLOSA points to the backend (port 8080), not the
    // Next.js frontend (port 3000). Setting it here was the root cause of
    // ALL E2E test failures — Playwright was hitting the backend instead of the UI.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // In CI, auto-start the dev server configured for Firebase emulator mocking.
  // Locally, reuse an already-running server (npm run dev:e2e) to avoid conflicts.
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})