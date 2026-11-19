import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWordMask,
  calculateDrawerPoints,
  calculateGuessPoints,
  evaluateGuess,
  normalizeGuess,
  pickHintRevealIndex,
  sanitizeRoomSettings,
  selectWordChoices,
} from './gameLogic';

test('normalizeGuess trims, lowercases, and collapses whitespace', () => {
  assert.equal(normalizeGuess('  Palm   Tree  '), 'palm tree');
  assert.equal(normalizeGuess('OCTOPUS'), 'octopus');
});

test('evaluateGuess detects exact, close, and miss cases', () => {
  assert.equal(evaluateGuess('Octopus', 'octopus'), 'exact');
  assert.equal(evaluateGuess('  palm tree ', 'palm tree'), 'exact');
  assert.equal(evaluateGuess('octopuz', 'octopus'), 'close');
  assert.equal(evaluateGuess('elephant', 'octopus'), 'miss');
});

test('buildWordMask handles normal, hidden, and combination modes', () => {
  assert.equal(buildWordMask('apple', new Set([0, 4]), 'normal'), 'a _ _ _ e');
  assert.equal(buildWordMask('apple', new Set(), 'hidden'), '???');
  assert.equal(buildWordMask('apple', new Set([2]), 'hidden'), '_ _ p _ _');
  assert.equal(buildWordMask('palm tree', new Set([0]), 'combination'), 'p _ _ _   _ _ _ _');
});

test('pickHintRevealIndex never reveals every character', () => {
  const revealed = new Set<number>([0, 1]);
  const next = pickHintRevealIndex('cat', revealed, () => 0);
  // 3 letters total, 2 revealed => must keep at least 1 hidden
  assert.equal(next, null);
});

test('calculateGuessPoints rewards faster and earlier guesses', () => {
  const firstFast = calculateGuessPoints(75, 80, 0);
  const secondSlow = calculateGuessPoints(20, 80, 1);
  assert.ok(firstFast > secondSlow);
  assert.ok(firstFast <= 500);
  assert.ok(secondSlow >= 100);
});

test('calculateDrawerPoints scales with proportion of guessers', () => {
  assert.equal(calculateDrawerPoints(0, 3), 0);
  assert.equal(calculateDrawerPoints(3, 3), 250);
  assert.ok(calculateDrawerPoints(1, 3) < calculateDrawerPoints(2, 3));
});

test('sanitizeRoomSettings clamps bounds within allowed ranges', () => {
  const s = sanitizeRoomSettings({
    maxPlayers: 99,
    rounds: 1,
    drawTime: 999,
    wordCount: 0,
    hints: 12,
  });
  assert.equal(s.maxPlayers, 20);
  assert.equal(s.rounds, 2);
  assert.equal(s.drawTime, 240);
  assert.equal(s.wordCount, 1);
  assert.equal(s.hints, 5);
});

test('selectWordChoices returns requested count and includes custom words', () => {
  const choices = selectWordChoices('Animals', ['narwhal', 'axolotl'], 3, new Set());
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices).size, 3);
});
