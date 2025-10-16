// We use bun.sh to run this file
import { parseArgs } from 'util'
import { inverse } from './utils/log'

// use --folder-filter to run only folders that include this filter string
// use --format-filter to filter by format (WFS, URL)
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    'folder-filter': { type: 'string' },
    'format-filter': { type: 'string' },
  },
  strict: true,
  allowPositionals: true,
})

const folderFilterTerm = values['folder-filter']
const formatFilter = values['format-filter'] as 'WFS' | 'URL' | undefined

inverse('Starting download update with settings', [
  {
    folderFilterTerm,
    formatFilter,
  },
])

// Import and run the appropriate download scripts
if (!formatFilter || formatFilter === 'WFS') {
  console.log('\n=== Running WFS Downloads ===')
  const { execSync } = await import('child_process')
  const wfsCommand = `bun ./scripts/StaticDatasets/downloadSources/updateWfsSources.ts${folderFilterTerm ? ` --folder-filter=${folderFilterTerm}` : ''}`
  execSync(wfsCommand, { stdio: 'inherit' })
}

if (!formatFilter || formatFilter === 'URL') {
  console.log('\n=== Running URL Downloads ===')
  const { execSync } = await import('child_process')
  const urlCommand = `bun ./scripts/StaticDatasets/downloadSources/updateUrlSources.ts${folderFilterTerm ? ` --folder-filter=${folderFilterTerm}` : ''}`
  execSync(urlCommand, { stdio: 'inherit' })
}

inverse('DONE')
