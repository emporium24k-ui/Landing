const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests-browser',
  timeout: 30000,
  expect: { timeout: 8000 },
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'desktop-chromium',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } }
    }
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/assistente/',
    reuseExistingServer: false,
    timeout: 20000
  }
});
