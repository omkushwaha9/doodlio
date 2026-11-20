
# Game Logic

## 1. Game Overview

Doodlio is a turn-based multiplayer drawing and guessing game.

Players take turns drawing a selected word while other players attempt to guess it.

## 2. Game Lifecycle

The general game lifecycle is:

```text
Room Creation
      |
      v
Players Join
      |
      v
Game Starts
      |
      v
Drawer Selects a Word
      |
      v
Drawing and Guessing
      |
      v
Round Ends
      |
      v
Next Player's Turn
      |
      v
More Rounds?
   /       \
 Yes       No
  |         |
  v         v
Next      Final
Round    Leaderboard
```

## 3. Room Management

A room groups players into a single game session.

Document:

- How rooms are created.
- How players join rooms.
- How room membership is maintained.
- How players disconnect or leave.

## 4. Drawing Turn

The active drawer receives the word-selection opportunity.

The selected word must remain hidden from players who are guessing.


## 5. Guess Matching

The game normalizes guesses by:

- Removing leading and trailing whitespace.
- Converting text to lowercase.
- Replacing consecutive whitespace with a single space.

Exact matches are accepted.

The game also supports close-guess feedback using Levenshtein distance:

- Words with 4–7 characters allow a distance of 1.
- Words with 8 or more characters allow a distance of 2.

Close guesses do not award points.

## 6. Scoring System

Guessers receive:

- 100 base points.
- Up to 300 speed bonus points.
- Up to 100 early-guess bonus points.

The speed bonus depends on the remaining drawing time.

The early-guess bonus decreases by 25 points for each earlier correct guess.

The drawer receives points based on the proportion of active guessers who guessed correctly:

`50 + (correct guessers / total guessers × 200)`

The drawer receives no points if nobody guesses correctly or if the drawer leaves.

## 7. Round Management

The game uses the following phases:

- `lobby`
- `choosing`
- `drawing`
- `round_end`
- `game_over`

The drawer has 15 seconds to select a word.

If no word is selected within that period, the first available option is automatically selected.

The drawing timer uses the configured room draw time.

A round ends when:

- All eligible guessers have guessed correctly.
- The drawing timer reaches zero.
- The drawer leaves.

A five-second pause occurs before the next turn or game completion.

## 8. Hints and Word Modes

The game supports:

- Normal word masking.
- Hidden word mode.
- Combination word mode.
- Timed letter reveals.

Hints are distributed during the drawing phase according to the configured hint count.

## 9. Game Completion

The leaderboard sorts active players by descending total score.

If two players have the same score, their names are sorted alphabetically.

The first leaderboard entry is selected as the winner.
