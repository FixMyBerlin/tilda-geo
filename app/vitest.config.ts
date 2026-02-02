import { loadEnvConfig } from '@next/env'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const projectDir = process.cwd()
loadEnvConfig(projectDir)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    dir: './',
    globals: true,
    setupFiles: './test/setup.ts',
    include: ['**/*.test.ts'], // Exclude .spec.ts which are Playwright tests
    maxWorkers: 1,
    alias: {
      '@/': new URL('./', import.meta.url).pathname,
    },
  },
})
