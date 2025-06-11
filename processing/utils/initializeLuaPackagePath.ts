import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { isDev } from './isDev'

const packagePathPrefix = { runProcessing: './', runTests: './processing' }

export const initializeLuaPackagePath = async (
  directoryContext: keyof typeof packagePathPrefix,
) => {
  const rootDir = './'
  // Default package.path is "/usr/local/share/lua/5.3/?.lua;/usr/local/share/lua/5.3/?/init.lua;/usr/local/lib/lua/5.3/?.lua;/usr/local/lib/lua/5.3/?/init.lua;/usr/share/lua/5.3/?.lua;/usr/share/lua/5.3/?/init.lua;./?.lua;./?/init.lua"
  // Which means in order to just `require('init')` we need to put the file into `./processing/init.lua`
  const resultFile = join(import.meta.dir, '../init.lua')
  const seen = new Set<string>()

  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.lua')) {
        seen.add(relative(packagePathPrefix[directoryContext], dir).replaceAll('\\', '/')) // Normalize for Windows too
      }
    }
  }

  await walk(rootDir)

  const pathLines = Array.from(seen)
    .filter((p) => !p.includes('__tests__'))
    .sort((a, b) => a.localeCompare(b))
    .map((p) => {
      return `package.path = package.path .. ";/${['processing', p, '?.lua'].filter(Boolean).join('/')}"`
    })
    .join('\n')

  const luaCode = `-- Auto-generated using processing/utils/initializeLuaPackagePath.ts
-- Runs on every processing run.
-- Extends the package.path to include all folders that have a .lua file (except for '__test__' folders).
-- We import this file via \`require('init')\` in every lua file.
${pathLines}

-- print('Known package path from \`init.lua\`: ' .. package.path) -- Use for temp debugging only because it breaks our \`writeTodoIdTypes\` helper because this print is added to that resuls "array".
`

  await Bun.write(resultFile, luaCode)
  console.log(
    'Processing: `init.lua`s `package.path` was updated',
    isDev ? { pathEntries: pathLines, resultFile } : '',
  )
}
