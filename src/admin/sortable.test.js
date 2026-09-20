import { describe, it, expect } from 'vitest';
import { moveItem } from './sortable.js';

describe('moveItem', () => {
  it('sposta un elemento senza mutare l\'originale', () => {
    const arr = ['a', 'b', 'c', 'd'];
    expect(moveItem(arr, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(arr, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(arr).toEqual(['a', 'b', 'c', 'd']);
  });
  it('indici uguali o fuori range → copia invariata', () => {
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
});
