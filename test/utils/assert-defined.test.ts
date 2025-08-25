import { expect, it } from 'vitest';
import { assertDefined } from '../../lib/utils/assert-defined';

it('should return the value if it is defined', () => {
  const value = 'defined';
  const result = assertDefined<string>(value, 'example');
  expect(result).toBe(value);
});

it('should throw an error if the value is undefined', () => {
  expect(() => assertDefined<string | undefined>(undefined, 'example')).toThrow('example is undefined');
});
