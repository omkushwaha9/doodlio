import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomEntity } from './Room';

test('RoomEntity enforces host start, turn rotation, drawing strokes, guessing, and scoring', () => {
  const room = new RoomEntity(
    'ABC123',
    { rounds: 2, drawTime: 60, wordCount: 3, hints: 2 },
    null
  );

  const p1 = room.addPlayer('s1', 'Alice');
  const p2 = room.addPlayer('s2', 'Bob');
  assert.equal(p1.ok, true);
  assert.equal(p2.ok, true);

  // Non-host cannot start
  const badStart = room.startGame('s2');
  assert.equal(badStart.ok, false);

  // Host starts game
  const goodStart = room.startGame('s1');
  assert.equal(goodStart.ok, true);
  assert.equal(room.game.phase, 'choosing');
  assert.equal(room.game.drawerId, 's1');
  assert.equal(room.game.wordOptions.length, 3);

  // Drawer chooses a word
  const chosenWord = room.game.wordOptions[0];
  const chose = room.game.chooseWord(
    's1',
    chosenWord,
    Array.from(room.players.values()),
    room.settings
  );
  assert.equal(chose, true);
  assert.equal(room.game.phase, 'drawing');

  // Snapshot hides secret word from guessers and reveals it to drawer
  const drawerSnap = room.getSnapshotFor('s1');
  const guesserSnap = room.getSnapshotFor('s2');
  assert.equal(drawerSnap.secretWord, chosenWord);
  assert.equal(guesserSnap.secretWord, null);

  // Drawer draws and undoes strokes
  room.handleDrawStart('s1', {
    id: 'st1',
    color: '#18181B',
    size: 8,
    isEraser: false,
    points: [{ x: 0.1, y: 0.1 }],
  });
  room.handleDrawMove('s1', 'st1', 0.5, 0.5);
  assert.equal(room.game.strokes.length, 1);

  room.handleDrawUndo('s1');
  assert.equal(room.game.strokes.length, 0);

  // Guesser guesses exact word -> ends round because all guessers guessed
  room.handleGuess('s2', chosenWord.toUpperCase());
  assert.equal(room.game.phase, 'round_end');
  assert.equal(room.game.roundEndReason, 'all_guessed');

  const alice = room.players.get('s1')!;
  const bob = room.players.get('s2')!;
  assert.ok(bob.score > 0);
  assert.ok(alice.score > 0);

  room.destroy();
});

test('RoomEntity migrates host when original host leaves', () => {
  const room = new RoomEntity('XYZ789', {}, null);
  room.addPlayer('s1', 'Alice');
  room.addPlayer('s2', 'Bob');
  room.removePlayer('s1');

  const bob = room.players.get('s2')!;
  assert.equal(bob.isHost, true);
  room.destroy();
});
