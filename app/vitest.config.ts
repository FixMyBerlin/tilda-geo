import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const env = loadEnv('test', process.cwd(), '')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/scripts', replacement: fileURLToPath(new URL('./scripts', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'mailers', replacement: fileURLToPath(new URL('./mailers', import.meta.url)) },
    ],
  },
  test: {
    dir: './',
    env,
    globals: true,
    setupFiles: './test/setup.ts',
    include: ['**/*.test.ts'], // Exclude .spec.ts which are Playwright tests
    maxWorkers: 1,
  },
})
