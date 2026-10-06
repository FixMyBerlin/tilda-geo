import { describe, expect, test, vi } from 'vitest'
import { ADMIN_DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/shared/pagination/constants'
import { paginate } from './paginate.server'

const makeList = (total: number) => Array.from({ length: total }, (_, index) => index + 1)

const stubPaginate = (
  items: number[],
  args: { skip?: number; take?: number; fallbackToLastPage?: boolean } = {},
) => {
  const query = vi.fn(async ({ skip, take }: { skip: number; take: number }) =>
    items.slice(skip, skip + take),
  )
  return {
    query,
    result: paginate({ ...args, count: async () => items.length, query }),
  }
}

describe('paginate', () => {
  test('returns the requested page', async () => {
    const { query, result } = stubPaginate(makeList(120), { skip: 50, take: 50 })
    expect(await result).toEqual({ rows: makeList(100).slice(50), total: 120, skip: 50, take: 50 })
    expect(query).toHaveBeenCalledTimes(1)
  })

  test('clamps skip and take', async () => {
    const defaults = await stubPaginate(makeList(10)).result
    expect(defaults).toMatchObject({ skip: 0, take: ADMIN_DEFAULT_PAGE_SIZE, total: 10 })

    const clamped = await stubPaginate(makeList(10), { skip: -5, take: 9999 }).result
    expect(clamped).toMatchObject({ skip: 0, take: MAX_PAGE_SIZE, total: 10 })
    expect(clamped.rows).toHaveLength(10)
  })

  test('returns an empty page past the end by default without querying (REST API / MCP clients page until empty)', async () => {
    const { query, result } = stubPaginate(makeList(120), { skip: 5000, take: 50 })
    expect(await result).toEqual({ rows: [], total: 120, skip: 5000, take: 50 })
    expect(query).not.toHaveBeenCalled()
  })

  test('falls back to the last page past the end when enabled, without a huge OFFSET query', async () => {
    const { query, result } = stubPaginate(makeList(120), {
      skip: 5000,
      take: 50,
      fallbackToLastPage: true,
    })
    expect(await result).toEqual({
      rows: makeList(120).slice(100),
      total: 120,
      skip: 100,
      take: 50,
    })
    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith({ skip: 100, take: 50 })
  })

  test('returns an empty first page for an empty list', async () => {
    const { query, result } = stubPaginate([], { skip: 100, take: 50, fallbackToLastPage: true })
    expect(await result).toEqual({ rows: [], total: 0, skip: 100, take: 50 })
    expect(query).not.toHaveBeenCalled()
  })
})
