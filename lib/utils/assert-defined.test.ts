import { expect, it } from 'vitest'
import { assertDefined } from './assert-defined'

it('should return the value if it is defined', () => {
  const value = 'defined'
  const result = assertDefined<string>(value)

  expect(result).toBe(value)
})

it('should throw an error if the value is undefined', () => {
  expect(() => assertDefined<string | undefined>(undefined)).toThrow('Value is undefined')
})
