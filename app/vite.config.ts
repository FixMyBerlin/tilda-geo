import { fileURLToPath, URL } from 'node:url'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { createLogger, defineConfig } from 'vite'

// Suppress "Module X has been externalized for browser compatibility" (pg/events etc.). Client still
// pulls in server modules via server-fn imports; we externalize them, so the warning is noise.
const defaultLogger = createLogger()
const customLogger = {
  ...defaultLogger,
  warn(msg: string, options?: Parameters<typeof defaultLogger.warn>[1]) {
    if (msg.includes('externalized for browser compatibility')) return
    defaultLogger.warn(msg, options)
  },
  warnOnce(msg: string, options?: Parameters<typeof defaultLogger.warnOnce>[1]) {
    if (msg.includes('externalized for browser compatibility')) return
    defaultLogger.warnOnce(msg, options)
  },
}

export default defineConfig({
  customLogger,
  // Pull `better-auth` client graph into the first `optimizeDeps` pass so the initial page load
  // does not discover dozens of `@better-auth/*` deps late, trigger a full reload, and abort the
  // in-flight `import(virtual:tanstack-start-client-entry)` (browser: Failed to fetch).
  environments: {
    client: {
      build: {
        sourcemap: true,
      },
      optimizeDeps: {
        include: ['better-auth/react', 'better-auth/client/plugins'],
        holdUntilCrawlEnd: true,
        ignoreOutdatedRequests: true,
      },
    },
    ssr: {
      build: {
        sourcemap: true,
      },
    },
  },
  server: {
    // Keep HMR pinned to the same host/port as `bun run dev` so websocket reconnects
    // stay stable after config-triggered restarts.
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 5173,
      clientPort: 5173,
    },
  },
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        find: '@/scripts',
        replacement: fileURLToPath(new URL('./scripts', import.meta.url)),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      onwarn(warning, warn) {
        // Strip non-actionable warnings about "use client" during build; we don't care about this directive in a Tanstack Start app.
        // Example: `node_modules/@headlessui/react/dist/components/portal/portal.js (1:0): Module level directives cause errors when bundled, "use client" in "node_modules/@headlessui/react/dist/components/portal/portal.js" was ignored.`
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      },
    },
  },
  plugins: [
    devtools({
      injectSource: {
        enabled: true,
        ignore: {
          // Skip source injection for the map subtree: these files are large/high-churn and make
          // TanStack Devtools slower and noisier during local debugging.
          files: [/src\/components\/regionen\/pageRegionSlug\/Map\//],
        },
      },
    }),
    nitro({
      preset: 'bun',
      plugins: [
        'src/server/instrumentation/nitro-env-validation.plugin.server.ts',
        'src/server/instrumentation/nitro-legacy-cookie-sweep.plugin.server.ts',
        'src/server/instrumentation/nitro-sql-registration.plugin.server.ts',
      ],
      sourcemap: true,
      // Workaround: Nitro's server build doesn't set Rolldown `platform: "node"`, causing CJS interop
      // crashes for modules like tslib (used by @aws-crypto). Can be removed once on nf3 >= 0.3.11
      // (which auto-externalizes tslib), or once Nitro properly sets `platform: "node"`.
      // Reproduction: https://github.com/FixMyBerlin/_reproduction-tanstack-start-nitro-esm-error
      rolldownConfig: {
        external: ['@aws-sdk/client-s3', /^@aws-crypto\//, /^@smithy\//],
      },
    }),
    tailwindcss(),
    tanstackStart({}),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
