import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import { applyDevPortSlotToProcessEnv } from './scripts/predev/devPortSlot'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load repo-level .env first so webServer (bun run dev) gets DATABASE_* etc.
dotenv.config({ path: path.resolve(__dirname, '../.env') })
// Worktree-isolated dev stacks put DEV_STACK_ID in repo-root .env.local. Load it so the test
// process matches `bun run dev` stack context. Host ports default to 5432/3000 unless overridden.
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
// Optional app-local env can override or extend defaults.
dotenv.config({ path: path.resolve(__dirname, '.env') })
// Then .env.test can override for test-only vars.
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

// A worktree on a port slot runs its dev server (and its own db) on offset ports; without this the
// suite would silently target the default stack on 5173 — another checkout's app and database.
const baseURL = applyDevPortSlotToProcessEnv().appOrigin

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
