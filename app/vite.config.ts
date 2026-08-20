import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import dotenv from 'dotenv'
import { nitro } from 'nitro/vite'
import { createLogger, defineConfig } from 'vite'
import { applyDevPortSlotToProcessEnv } from './scripts/predev/devPortSlot'
import { logErr } from './scripts/predev/predevLog'
import { forwardApiRequestsPastViteAssetMiddleware } from './vite/forwardApiRequestsPastViteAssetMiddleware'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
dotenv.config({ path: `${repoRoot}/.env` })
dotenv.config({ path: `${repoRoot}/.env.local` })

let devPortSlot
try {
  devPortSlot = applyDevPortSlotToProcessEnv()
} catch (e) {
  logErr('vite_config', e instanceof Error ? e.message : String(e))
  process.exit(1)
}
const devVitePort = devPortSlot.vitePort

const appRoot = fileURLToPath(new URL('.', import.meta.url))

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
  // MapLibre v6 is ESM-only; keep it in the SSR bundle so Vite does not resolve a stale CJS path.
  // @see https://maplibre.org/maplibre-gl-js/docs/#installation
  ssr: {
    noExternal: ['maplibre-gl'],
  },
  // Pull `better-auth` client graph into the first `optimizeDeps` pass so the initial page load
  // does not discover dozens of `@better-auth/*` deps late, trigger a full reload, and abort the
  // in-flight `import(virtual:tanstack-start-client-entry)` (browser: Failed to fetch).
  environments: {
    client: {
      build: {
        // package.json browserslist (market-share queries) is the single source of truth
        // for client build target and eslint-plugin-compat. Server/Bun code is unaffected.
        target: browserslistToEsbuild(),
        sourcemap: true,
      },
      optimizeDeps: {
        // holdUntilCrawlEnd defaults to true in Vite 8 — deps bundle into deps_temp_* but
        // never commit to deps/ while crawl is active, stalling react.js and all client hydration.
        include: [
          'better-auth/react',
          'better-auth/client/plugins',
          'motion/react',
          '@floating-ui/react',
        ],
        holdUntilCrawlEnd: false,
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
    host: '127.0.0.1',
    port: devVitePort,
    strictPort: true,
    // Bun globalStore (app/bunfig.toml) symlinks realpath outside the project (~/.bun/install/cache/links/).
    // Extend (not replace) Vite's default fs.allow — setting allow alone drops the project root.
    // Phantom deps (direct in package.json): crossws — Nitro dev entry imports crossws/adapters/node.
    // @see https://bun.com/docs/pm/global-store#phantom-dependency-fallback
    // @see https://vite.dev/config/server-options.html#server-fs-allow
    fs: {
      allow: [appRoot, join(homedir(), '.bun/install/cache/links')],
    },
    // Keep HMR pinned to the same host/port as `bun run dev` so websocket reconnects
    // stay stable after config-triggered restarts.
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: devVitePort,
      clientPort: devVitePort,
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
    // Dev-only: let `<img src="/api/...">` (Sec-Fetch-Dest: image) reach the route handlers instead
    // of Vite's static-asset pipeline (which 404s). Must run before Vite's asset middleware.
    forwardApiRequestsPastViteAssetMiddleware(),
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
    viteReact({ compiler: true }),
  ],
})
