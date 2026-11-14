import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev -- --host localhost --port 5173 --strictPort',
    url: 'http://localhost:5173',
    env: {
      VITE_API_URL: 'http://localhost:8080',
      VITE_FONTE_GUIAS: 'api',
      VITE_AUTH_MOCK_GUIAS: 'true'
    }
  }
})
