import { describe, it, expect } from 'vitest';
import { shuffle, generateCard } from './cardUtils.js';

describe('shuffle', () => {
  it('returns same length array', () => {
    expect(shuffle([1,2,3,4,5], 42).length).toBe(5);
  });
  it('contains same elements', () => {
    const result = shuffle([1,2,3,4,5], 42);
    expect(result.sort()).toEqual([1,2,3,4,5]);
  });
  it('is deterministic with same seed', () => {
    expect(shuffle([1,2,3,4,5], 99)).toEqual(shuffle([1,2,3,4,5], 99));
  });
  it('produces different orders with different seeds', () => {
    expect(shuffle([1,2,3,4,5,6,7,8,9,10], 1))
      .not.toEqual(shuffle([1,2,3,4,5,6,7,8,9,10], 2));
  });
});

describe('generateCard', () => {
  const songs = Array.from({ length: 50 }, (_, i) => `Song ${i}`);
  it('returns exactly 25 songs', () => {
    expect(generateCard(songs, 0).length).toBe(25);
  });
  it('contains only songs from the list', () => {
    const card = generateCard(songs, 0);
    card.forEach(s => expect(songs).toContain(s));
  });
  it('has no duplicate songs on a card', () => {
    const card = generateCard(songs, 0);
    expect(new Set(card).size).toBe(25);
  });
  it('produces different cards for different indices', () => {
    expect(generateCard(songs, 0)).not.toEqual(generateCard(songs, 1));
  });
  it('is deterministic for same songs + index', () => {
    expect(generateCard(songs, 5)).toEqual(generateCard(songs, 5));
  });
});
