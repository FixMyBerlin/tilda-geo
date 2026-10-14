import { describe, expect, test } from 'vitest'
import { mapStyleResponse } from './mapStyleResponse'
import { SPRITE_VERSION } from './spriteVersion.const'

const get = (headers?: HeadersInit) =>
  mapStyleResponse(new Request('http://localhost/api/map-style', { headers }))

describe('mapStyleResponse', () => {
  test('points the sprite to the current sprite version', async () => {
    const style = await get().json()
    expect(process.env.VITE_APP_ORIGIN).toMatch(/^https?:\/\//)
    expect(style.sprite).toBe(`${process.env.VITE_APP_ORIGIN}/map-style/sprite?v=${SPRITE_VERSION}`)
  })

  test('asks the browser to revalidate and answers an unchanged style with 304', async () => {
    const first = get()
    const etag = first.headers.get('ETag') ?? ''
    expect(first.headers.get('Cache-Control')).toBe('no-cache')
    expect(etag).toMatch(/^"[0-9a-f]{16}"$/)

    const second = get({ 'If-None-Match': etag })
    expect(second.status).toBe(304)
    expect(await second.text()).toBe('')

    expect(get({ 'If-None-Match': `W/${etag}` }).status).toBe(304)
    expect(get({ 'If-None-Match': '*' }).status).toBe(304)
    expect(get({ 'If-None-Match': '"other"' }).status).toBe(200)
  })
})
