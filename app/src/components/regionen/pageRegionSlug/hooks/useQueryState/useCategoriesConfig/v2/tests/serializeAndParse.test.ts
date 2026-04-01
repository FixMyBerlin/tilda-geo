import { describe, expect, test } from 'vitest'
import { decodeBits, encodeBits, iterate } from '../lib'
import { parse } from '../parse'
import { serialize } from '../serialize'
import { freshConfig } from './freshConfig'

// used to generate the inputs for "test('array of booleans is the same..."
function _randomBits() {
  let s = ''
  for (let i = 0; i < 4; i++) {
    s += Math.floor(Math.random() * 2 ** 32)
      .toString(2)
      .padStart(32, '0')
  }
  return s.slice(0, Math.floor(Math.random() * 64) + 64)
}

describe('Config param parser and serializer v2', () => {
  test('array of booleans is the same after encodeBits() and decodeBits()', () => {
    const bits = [
      '100000011110100010101100111011110101011111100111010110010001100110',
      '001010010011000000101110100000000101111000010010100001101111111000101111000000100',
      '0000101110001011001001111001011110000110100001001101100110010111111111101000011000011010',
      '1101001100000000011011101001010111001000000111000110111101001011011011101100010000010',
    ]
    bits.forEach((b) => {
      const booleans = b.split('').map((v) => !!Number(v))
      const result = decodeBits(encodeBits(booleans))
      expect(result.slice(0, b.length)).toMatchObject(booleans)
    })
  })
  test('config is the same after serialize() and parse()', () => {
    const config = structuredClone(freshConfig)
    iterate(config, (obj, _path) => (obj.active = !obj.active))
    const serialized = serialize(config)
    const result = parse(serialized, freshConfig)
    expect(result).toMatchObject(config)
  })
})
