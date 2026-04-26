// Returns 12 line index arrays for a 5×5 grid: 5 rows, 5 cols, 2 diagonals
export function getLines() {
  const lines = [];
  for (let r = 0; r < 5; r++) lines.push([0,1,2,3,4].map(c => r * 5 + c)); // rows
  for (let c = 0; c < 5; c++) lines.push([0,1,2,3,4].map(r => r * 5 + c)); // cols
  lines.push([0, 6, 12, 18, 24]); // top-left diagonal
  lines.push([4, 8, 12, 16, 20]); // top-right diagonal
  return lines;
}

// Count how many of the 12 lines are fully covered by calledSongsSet
export function countCompletedLines(card, calledSongsSet) {
  return getLines().filter(line =>
    line.every(idx => calledSongsSet.has(card[idx]))
  ).length;
}

// True if all 25 squares are covered
export function isBlackout(card, calledSongsSet) {
  return card.every(song => calledSongsSet.has(song));
}

// Returns { first: number[], second: number[], third: number[] }
// Each array contains 1-indexed sheet numbers eligible for that prize.
// Sheet N = cards at indices (N-1)*2 and (N-1)*2+1.
export function computeWinners(cards, calledSongsSet) {
  const sheetCount = Math.ceil(cards.length / 2);
  const first = [], second = [], third = [];

  for (let s = 0; s < sheetCount; s++) {
    const cardA = cards[s * 2];
    const cardB = cards[s * 2 + 1];
    const linesA = countCompletedLines(cardA, calledSongsSet);
    const linesB = cardB ? countCompletedLines(cardB, calledSongsSet) : 0;
    const blackoutA = isBlackout(cardA, calledSongsSet);
    const blackoutB = cardB ? isBlackout(cardB, calledSongsSet) : false;
    const sheet = s + 1;

    if (blackoutA || blackoutB) third.push(sheet);
    if (linesA >= 2 || linesB >= 2) second.push(sheet);
    if (linesA >= 1 || linesB >= 1) first.push(sheet);
  }

  return { first, second, third };
}
