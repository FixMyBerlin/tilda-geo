import { definePlugin } from 'nitro'
import { registerSQLFunctions } from './registerSQLFunctions.server'

let initPromise: Promise<void> | null = null

export default definePlugin(
  (nitroApp: { hooks: { hook: (name: 'request', fn: () => Promise<void>) => void } }) => {
    nitroApp.hooks.hook('request', async () => {
      if (!initPromise) initPromise = registerSQLFunctions()
      await initPromise
    })
  },
)
