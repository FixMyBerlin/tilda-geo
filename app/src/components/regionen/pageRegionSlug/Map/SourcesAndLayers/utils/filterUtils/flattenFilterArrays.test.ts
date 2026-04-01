import { describe, expect, test } from 'vitest'
import { flattenFilterArrays } from './flattenFilterArrays'

describe('flattenFilterArrays()', () => {
  test('input 1 empty, input 2 array', () => {
    const input1 = undefined
    const input2 = ['foo']
    const result = flattenFilterArrays(input1, input2)
    expect(result).toMatchObject(['foo'])
  })

  test('input 2 empty, input 1 array', () => {
    const input2 = undefined
    const input1 = ['foo', true]
    const result = flattenFilterArrays(input1, input2)
    expect(result).toMatchObject(['foo', true])
  })

  test('input 1 one-dimensional, input 2 one-dimensional', () => {
    const input1 = ['foo', true]
    const input2 = ['lorem', true]
    const result = flattenFilterArrays(input1, input2)
    expect(result).toMatchObject([input1, input2])
  })

  test('input 1 two-dimensional, input 2 one-dimensional', () => {
    const input1 = [
      ['foo', true],
      ['baz', false],
    ]
    const input2 = ['bar', true]
    const result = flattenFilterArrays(input1, input2)
    expect(result).toMatchObject([...input1, input2])
  })

  test('input 2 two-dimensional, input 1 one-dimensional', () => {
    const input2 = [
      ['foo', true],
      ['baz', false],
    ]
    const input1 = ['bar', true]
    const result = flattenFilterArrays(input1, input2)
    expect(result).toMatchObject([input1, ...input2])
  })

  test('input 1 two-dimensional, input 2 two-dimensional', () => {
    const input1 = [
      ['foo', true],
      ['bar', false],
    ]
    const input2 = [
      ['lorem', false],
      ['ipsum', true],
    ]
    const result = flattenFilterArrays(input1, input2)
    expect(result).toMatchObject([...input1, ...input2])
  })

  test('input 1 "all"-array two-dimensional, input 2 "all"-array two-dimensional', () => {
    const input1 = ['all', ['foo', true], ['bar', false]]
    const input2 = ['all', ['lorem', false], ['ipsum', true]]
    const result = flattenFilterArrays(input1, input2)
    expect(result).toMatchObject([
      ['foo', true],
      ['bar', false],
      ['lorem', false],
      ['ipsum', true],
    ])
  })
})
