import { defineConfig, devices } from '@playwright/test';

// Deterministic rasterisation, the same flags the mockup baseline is captured with.
const RASTER_FLAGS = [
  '--disable-gpu',
  '--force-color-profile=srgb',
  '--disable-lcd-text',
  '--font-render-hinting=none',
  '--disable-font-subpixel-positioning',
];

export default defineConfig({
  use: { baseURL: 'http://127.0.0.1:4173' },
  projects: [
    { name: 'chromium', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'fidelity',
      testDir: './tests/fidelity',
      testMatch: '**/*.spec.ts',
      timeout: 180000,
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        timezoneId: 'Asia/Jakarta',
        locale: 'en-US',
        launchOptions: { args: RASTER_FLAGS },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
