import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  afterthoughtIds,
  afterthoughtSkipReasons,
} from '@/data/processingTypes/afterthoughts.const'

/**
 * WHY THIS TEST EXISTS
 * The processing Docker image cannot import from app/, so the afterthought ids + skip-reason keys
 * are kept in two hand-maintained files that must agree:
 *   - SOURCE: processing/constants/afterthoughts.const.ts        (used by the processing run)
 *   - MIRROR: app/src/data/processingTypes/afterthoughts.const.ts (used by the admin UI; adds German labels)
 *
 * HOW TO FIX A FAILURE
 * The value named in the failure message exists in the app mirror but is missing from the
 * processing source. Add (or rename) the matching string literal in
 * processing/constants/afterthoughts.const.ts so both files use the exact same keys, then re-run.
 * German labels live in the app mirror only and are intentionally NOT checked here.
 */
const processingConstPath = join(
  import.meta.dirname,
  '../../../../processing/constants/afterthoughts.const.ts',
)
const processingSource = readFileSync(processingConstPath, 'utf8')

const fixHint = (kind: 'id' | 'skip reason', value: string) =>
  `Afterthought ${kind} "${value}" is in the app mirror (app/src/data/processingTypes/afterthoughts.const.ts) ` +
  `but missing from the processing source. Add the literal '${value}' to ` +
  `processing/constants/afterthoughts.const.ts so both files stay in sync.`

describe('afterthoughts.const sync', () => {
  it('every app afterthought id exists in the processing source', () => {
    for (const id of afterthoughtIds) {
      expect(processingSource, fixHint('id', id)).toContain(`'${id}'`)
    }
  })

  it('every app afterthought skip reason exists in the processing source', () => {
    for (const reason of afterthoughtSkipReasons) {
      expect(processingSource, fixHint('skip reason', reason)).toContain(`'${reason}'`)
    }
  })
})
