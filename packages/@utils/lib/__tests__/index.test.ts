import { describe, test, expect } from 'bun:test';
import { Primitives } from '../index.ts';

describe('@pokemon/utils', () => {
  test('@pokemon/utils Primitives', () => {
    expect(Primitives.coerceToArray(1)).toEqual([1]);
    expect(Primitives.coerceToArray([1, 2, 3])).toEqual([1, 2, 3]);
    expect(Primitives.coerceToArray(new Set([1, 2, 3]))).toEqual([1, 2, 3]);
    expect(
      Primitives.coerceToArray(
        new Map([
          ['a', 1],
          ['b', 2],
          ['c', 3]
        ])
      )
    ).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3]
    ]);
    expect(Primitives.coerceToArray({ a: 1, b: 2, c: 3 })).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3]
    ]);

    expect(Primitives.coerceToString(1)).toEqual('1');
    expect(Primitives.coerceToString([1, 2, 3])).toEqual('[1,2,3]');
  });
});
