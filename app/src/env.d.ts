/// <reference types="vite/client" />

import type { EnvFullSchema, EnvVite } from './server/envSchema'

declare global {
  /** Augment Bun's ImportMetaEnv (index signature) with our required VITE_* keys from schema */
  interface ImportMetaEnv extends EnvVite {}

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  /**
   * Server-only env (Node/Bun); VITE_* are also in process.env when running server.
   * Note: bun-types can still infer process.env.* as string | undefined (Bun #18594).
   * At call sites, guard then use, or use `as string` after a runtime check.
   */
  namespace NodeJS {
    interface ProcessEnv extends EnvFullSchema {}
  }
}
