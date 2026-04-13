import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Vitest unit tests use only the repository-root env setup.
// `loadEnv('test', …, 'VITE_')` keeps browser-facing keys and respects CI `VITE_*` overrides.
const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const env = loadEnv('test', repoRoot, 'VITE_')

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
    include: ['**/*.test.ts', '**/*.test.tsx'], // Exclude .spec.ts which are Playwright tests
    maxWorkers: 1,
  },
})
