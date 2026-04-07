/**
 * Env validation runs once at server startup via this Nitro plugin.
 * - We validate process.env against appEnvSchema (vite + app server only); the server does not start if validation fails.
 * - Script/processing env and shell vars are not required at startup; we log them as FYI.
 * - Types in env.d.ts mirror the same contract (ProcessEnv / ImportMetaEnv).
 */

import { styleText } from 'node:util'
import { definePlugin } from 'nitro'
import { z } from 'zod'
import { envAppStartupValidationSchema, envFullSchema } from '../envSchema'
import { pluginOk } from './utils/pluginLog'

const DEBUG_UNKNOWN_KEYS = false

function logUnknownEnvKeysIfEnabled() {
  if (!DEBUG_UNKNOWN_KEYS) return
  const knownEnvKeys = new Set(Object.keys(envFullSchema.shape))
  const ignoredEnvPrefixes = [
    'VSCODE_',
    'CURSOR_',
    'BUN_',
    'NVM_',
    'HOMEBREW_',
    'TERM_',
    'npm_',
    'PNPM_',
    'LC_',
    'USER_',
    'XPC_',
  ]
  const unknownKeys = Object.keys(process.env)
    .filter((k) => !knownEnvKeys.has(k))
    .filter((k) => !ignoredEnvPrefixes.some((p) => k.startsWith(p)))
    .sort((a, b) => a.localeCompare(b))
  if (unknownKeys.length > 0) {
    console.info(
      styleText(
        'dim',
        `Env keys not in app server schema yet (${unknownKeys.length}): ${unknownKeys.join(', ')}`,
      ),
    )
  }
}

export default definePlugin(() => {
  const result = envAppStartupValidationSchema.safeParse(process.env, { reportInput: true })
  if (!result.success) {
    console.error(styleText(['bold', 'red'], '\n❌ Server env validation failed:\n'))
    console.error(styleText('yellow', z.prettifyError(result.error)))
    throw result.error
  }

  pluginOk('[env]', 'Env validation passed')
  logUnknownEnvKeysIfEnabled()
})
