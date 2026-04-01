import { definePlugin } from 'nitro'
import { registerSQLFunctions } from './registerSQLFunctions.server'

let initPromise: Promise<void> | null = null

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async () => {
    if (!initPromise) initPromise = registerSQLFunctions()
    await initPromise
  })
})
