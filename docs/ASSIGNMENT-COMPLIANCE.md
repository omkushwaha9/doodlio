# Assignment Compliance Tracker

This document maps the supplied seven-page internship assignment to the Doodlio source tree. It is a code-review checklist, not a claim that every feature has passed end-to-end testing. Confirm each item in a running two-player game before submission.

## Core requirements

| # | Requirement | Main implementation | Review status |
|---:|---|---|---|
| 1 | Create/join public and private rooms | `server/Room.ts`, `server/MessageHandler.ts`, `LobbyEntry.tsx` | Present in source; runtime test required |
| 2 | Turn-based drawing | `server/Game.ts` | Present in source; runtime test required |
| 3 | Real-time drawing via WebSockets | `DrawingCanvas.tsx`, `server/MessageHandler.ts` | Present in source; runtime test required |
| 4 | Word selection and hints/blanks | `server/Game.ts`, `gameLogic.ts` | Present in source; verify all modes |
| 5 | Correct-guess scoring, leaderboard and winner | `server/Game.ts`, `Room.ts`, `PlayerListSidebar.tsx` | Present in source; runtime test required |
| 6 | Socket sync for drawing, guesses, chat and state | `server/MessageHandler.ts`, `src/utils/socket.ts` | Present in source; runtime test required |

## Room and lobby

| Assignment item | Main implementation | Notes |
|---|---|---|
| Host creates room with settings | `LobbyEntry.tsx`, `Room.ts` | Verify server-side bounds for each setting |
| Join by link or room code | `LobbyEntry.tsx`, `MessageHandler.ts` | Test copied invite URL and manual code |
| Lobby player list and ready-up | `RoomLobby.tsx`, `Player.ts` | Test ready/unready and host start |
| Private invite-only room | `Room.ts`, `MessageHandler.ts` | Test unauthorized discovery/join |
| Public room directory | `LobbyEntry.tsx`, `server.ts` | Public-room discovery is optional in the assignment |

## Game flow

| Assignment item | Main implementation | Notes |
|---|---|---|
| Drawer chooses 1–5 words | `Game.ts`, `Room.ts` | Verify the selected count range |
| Strokes sync in real time | `DrawingCanvas.tsx`, `MessageHandler.ts` | Test multiple strokes and canvas resize |
| First correct guess receives points | `Room.ts`, `gameLogic.ts` | Test correct and incorrect guesses |
| Optional letter hints | `Game.ts` | Verify configured hint count and timing |
| Round ends on guess or timeout | `Game.ts` | Test both paths |
| Game end shows winner/leaderboard | `Game.ts`, game-end UI | Complete a full game |

## Drawing tools

| Tool | Main implementation | Notes |
|---|---|---|
| Brush/pen | `DrawingCanvas.tsx` | Verify drawer-only authorization |
| Multiple colors | `DrawingCanvas.tsx` | Verify all palette choices |
| Brush sizes | `DrawingCanvas.tsx` | Verify thin and thick strokes |
| Eraser | `DrawingCanvas.tsx` | Included as a drawing tool |
| Undo | `DrawingCanvas.tsx`, server drawing history | Verify all viewers update |
| Clear canvas | `DrawingCanvas.tsx`, `MessageHandler.ts` | Verify drawer-only permission |

## Room settings and required ranges

The assignment specifies:

| Setting | Required range |
|---|---:|
| Maximum players | 2–20 |
| Rounds | 2–10 |
| Draw time | 15–240 seconds |
| Word choices | 1–5 |
| Hints | 0–5 or disabled |
| Word mode | Normal, Hidden, Combination (Combination is optional in the assignment's room-settings table) |

Verify both the UI input constraints and server-side validation. Never rely only on HTML input min/max values.

## Functional priority checklist

### Must Have

- [ ] Create room with configurable settings.
- [ ] Join room via link or code.
- [ ] Lobby with player list; host starts game.
- [ ] Turn-based rounds: one drawer, others guess.
- [ ] Real-time drawing sync; strokes visible to all.
- [ ] Word selection for drawer (1–5 choices).
- [ ] Guessing and points for correct guesses.
- [ ] Scoring and leaderboard.
- [ ] Game end with winner.
- [ ] Brush, colors, undo and clear.

### Should Have

- [ ] Hints reveal letters over time.
- [ ] Chat supports guesses and general messages as configured.
- [ ] Draw-time countdown.
- [ ] Private rooms with invite link.

### Nice to Have

- [ ] Word categories.
- [ ] Eraser.
- [ ] Host kick/ban moderation.
- [ ] Votekick.
- [ ] Multiple languages for word lists.

**Known qualification:** The source includes word categories, eraser and votekick. Host kick is present. Ban handling exists on the server, but a complete distinct Ban UI and durable identity-based ban policy need review. A multilingual word-bank selector is not claimed as complete.

## Bonus ideas

| Bonus | Source evidence | Status note |
|---|---|---|
| OOP WebSocket server | `Player.ts`, `Room.ts`, `Game.ts`, `MessageHandler.ts` | Class-based structure present |
| Configurable room settings | `Room.ts`, lobby components | Verify all assignment ranges |
| Normal/Hidden/Combination modes | `gameLogic.ts`, `Game.ts` | Present in source; test each mode |
| Kick, ban, votekick, report | `Room.ts`, `MessageHandler.ts`, `PlayerListSidebar.tsx` | Kick/votekick present; Ban UI and Report workflow need completion |
| Host custom word list | `words.ts`, lobby/room settings, game logic | Present in source; test persistence/sanitization |
| Player avatars | lobby and player components | Present in UI; test updates across clients |
| Spectator mode | room/game/server and UI components | Present in source; verify spectator cannot draw/guess |
| Drawing replay | `Game.ts`, `DrawingCanvas.tsx` | Present in source; verify full round replay |

## Deployment and deliverables

- [ ] Deploy a working application publicly on Render, Railway, or an appropriate split frontend/backend platform.
- [ ] Verify create room → draw → guess → score in production.
- [ ] Add the real live URL to `README.md`.
- [ ] Keep setup instructions in `README.md`.
- [ ] Maintain the architecture overview in `docs/ARCHITECTURE.md`.
- [ ] Be prepared to explain stroke capture/rendering, game-state and scoring, WebSocket sync, word matching, and deployment constraints.

## Code walkthrough topics

1. How pointer input becomes drawing-stroke data and is rendered on other clients.
2. How `GameManager` controls rounds, turn order, timer, hints and scoring.
3. How Socket.IO events are routed through `MessageHandler`.
4. How word matching handles case, whitespace and typo/partial behavior; explain only the behavior actually implemented in `gameLogic.ts`.
5. Why a persistent Node.js host is used for Socket.IO and what changes if the frontend/backend are split.
