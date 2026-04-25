import { describe, it, expect } from 'vitest';
import { getLines, countCompletedLines, isBlackout, computeWinners } from './winnerUtils.js';

// A simple ordered card: ['S0','S1',...,'S24']
const makeCard = (offset = 0) => Array.from({ length: 25 }, (_, i) => `S${i + offset}`);

describe('getLines', () => {
  it('returns 12 lines', () => {
    expect(getLines().length).toBe(12);
  });
  it('each line has 5 indices', () => {
    getLines().forEach(line => expect(line.length).toBe(5));
  });
  it('first row is [0,1,2,3,4]', () => {
    expect(getLines()[0]).toEqual([0,1,2,3,4]);
  });
  it('first column is [0,5,10,15,20]', () => {
    expect(getLines()[5]).toEqual([0,5,10,15,20]);
  });
  it('top-left diagonal is [0,6,12,18,24]', () => {
    expect(getLines()[10]).toEqual([0,6,12,18,24]);
  });
  it('top-right diagonal is [4,8,12,16,20]', () => {
    expect(getLines()[11]).toEqual([4,8,12,16,20]);
  });
});

describe('countCompletedLines', () => {
  it('returns 0 when nothing called', () => {
    expect(countCompletedLines(makeCard(), new Set())).toBe(0);
  });
  it('returns 1 when first row called', () => {
    const called = new Set(['S0','S1','S2','S3','S4']);
    expect(countCompletedLines(makeCard(), called)).toBe(1);
  });
  it('returns 2 when first row and first column called', () => {
    const called = new Set(['S0','S1','S2','S3','S4','S5','S10','S15','S20']);
    expect(countCompletedLines(makeCard(), called)).toBe(2);
  });
  it('returns 12 for a full card', () => {
    const called = new Set(makeCard());
    expect(countCompletedLines(makeCard(), called)).toBe(12);
  });
});

describe('isBlackout', () => {
  it('returns false when nothing called', () => {
    expect(isBlackout(makeCard(), new Set())).toBe(false);
  });
  it('returns false when only 24 songs called', () => {
    const called = new Set(makeCard().slice(0, 24));
    expect(isBlackout(makeCard(), called)).toBe(false);
  });
  it('returns true when all 25 songs called', () => {
    expect(isBlackout(makeCard(), new Set(makeCard()))).toBe(true);
  });
});

describe('computeWinners', () => {
  it('returns empty arrays when nothing called', () => {
    const cards = [makeCard(0), makeCard(25), makeCard(50), makeCard(75)];
    const result = computeWinners(cards, new Set());
    expect(result).toEqual({ first: [], second: [], third: [] });
  });

  it('1st prize: sheet 1 eligible when card 1 has a row', () => {
    const cards = [makeCard(0), makeCard(25), makeCard(50), makeCard(75)];
    // Complete first row of card 1 (index 0): S0-S4
    const called = new Set(['S0','S1','S2','S3','S4']);
    const result = computeWinners(cards, called);
    expect(result.first).toContain(1);
    expect(result.first).not.toContain(2);
  });

  it('2nd prize: sheet eligible when same card has 2 lines', () => {
    const cards = [makeCard(0), makeCard(25), makeCard(50), makeCard(75)];
    // First row + first column of card 1
    const called = new Set(['S0','S1','S2','S3','S4','S5','S10','S15','S20']);
    const result = computeWinners(cards, called);
    expect(result.second).toContain(1);
  });

  it('3rd prize: sheet eligible on blackout of one card', () => {
    const cards = [makeCard(0), makeCard(25)];
    const called = new Set(makeCard(0)); // All songs from card 1
    const result = computeWinners(cards, called);
    expect(result.third).toContain(1);
  });

  it('2nd prize requires 2 lines on same card, not split across two', () => {
    // Sheet 1: card A has 1 line, card B has 1 line — should be 1st only
    const cardA = makeCard(0);
    const cardB = makeCard(25);
    const called = new Set([
      // Row 0 of cardA
      'S0','S1','S2','S3','S4',
      // Row 0 of cardB
      'S25','S26','S27','S28','S29',
    ]);
    const result = computeWinners([cardA, cardB], called);
    expect(result.first).toContain(1);
    expect(result.second).not.toContain(1);
  });

  it('a blackout sheet appears in all three prize tiers', () => {
    const cards = [makeCard(0), makeCard(25)];
    const called = new Set(makeCard(0)); // All 25 songs from card 1 = blackout
    const result = computeWinners(cards, called);
    expect(result.third).toContain(1);
    expect(result.second).toContain(1);
    expect(result.first).toContain(1);
  });
});
