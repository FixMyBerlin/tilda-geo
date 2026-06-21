import { parseArgs } from 'node:util'
import { argv } from '@/scripts/lib/bun'
import { maprouletteRebuildTasks } from './utils/maprouletteRebuildTasks'

// https://bun.sh/guides/process/argv
const { values } = parseArgs({
  args: argv,
  options: {
    filter: { type: 'string' },
  },
  strict: true,
  allowPositionals: true,
})

maprouletteRebuildTasks(values.filter)
