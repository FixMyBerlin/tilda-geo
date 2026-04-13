import { describe, expect, test } from 'vitest'
import {
  createSourceKeyStaticDatasets,
  parseSourceKeyStaticDatasets,
} from './sourceKeyUtilsStaticDataset'

describe('extractSourceIdFromStaticDatasetSourceKey()', () => {
  test('works with a simple source', () => {
    const input = createSourceKeyStaticDatasets('fooSource', undefined)
    const result = parseSourceKeyStaticDatasets(input).sourceId
    expect(result).toMatch('fooSource')
  })

  test('works with a simple source', () => {
    const input = createSourceKeyStaticDatasets('fooSource', 'fooSubId')
    const result = parseSourceKeyStaticDatasets(input).sourceId
    expect(result).toMatch('fooSource')
  })
})
