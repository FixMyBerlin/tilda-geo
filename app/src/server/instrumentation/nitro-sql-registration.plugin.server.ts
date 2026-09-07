import { definePlugin } from 'nitro'
import type { NitroAppPlugin } from 'nitro/types'
import { registerSQLFunctions } from './registerSQLFunctions.server'

let initPromise: Promise<void> | null = null

const sqlRegistrationPlugin: NitroAppPlugin = (nitroApp) => {
  nitroApp.hooks.hook('request', async () => {
    if (!initPromise) initPromise = registerSQLFunctions()
    await initPromise
  })
}

export default definePlugin(sqlRegistrationPlugin)
