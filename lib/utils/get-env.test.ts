import { expect, it } from 'vitest';
import { getEnv } from './get-env';

it('should throw an error if the environment variable is missing', () => {
  expect(() => getEnv('EXAMLE')).toThrow(
    'Environment variable EXAMLE is missing',
  );
});

it('should return the value of the environment variable', () => {
  process.env.EXAMPLE = 'test';
  expect(getEnv('EXAMPLE')).toBe('test');
});
