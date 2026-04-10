import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load repo-level .env first so webServer (bun run dev) gets DATABASE_* etc.
dotenv.config({ path: path.resolve(__dirname, '../.env') })
// Optional app-local env can override or extend defaults.
dotenv.config({ path: path.resolve(__dirname, '.env') })
// Then .env.test can override for test-only vars.
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const baseURL = 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
