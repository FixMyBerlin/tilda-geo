import { parseArgs } from 'node:util'
import { maprouletteRebuildTasks } from './utils/maprouletteRebuildTasks'

// https://bun.sh/guides/process/argv
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    filter: { type: 'string' },
  },
  strict: true,
  allowPositionals: true,
})

maprouletteRebuildTasks(values.filter)
