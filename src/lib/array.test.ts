import { dedupe } from './array';

describe('Array utilities', () => {
  test('Returns an array with duplicate values removed', () => {
    const input = [0, 1, 2, 1, 0, 'a', 'b', 'c', 'a'];
    expect(dedupe(input)).toEqual([0, 1, 2, 'a', 'b', 'c']);
  });

  test('Returns an array with duplicate values removed (multi-dimensional)', () => {
    const input = [0, 1, 2, 1, 0, 'a', 'b', 'c', 'a', [0, 1, 2, 0, ['a', 'a']]];
    expect(dedupe(input)).toEqual([0, 1, 2, 'a', 'b', 'c', [0, 1, 2, ['a']]]);
  });
});
