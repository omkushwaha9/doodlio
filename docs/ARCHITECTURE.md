# Doodlio Architecture

## 1. System overview

Doodlio uses a client/server architecture with a single Node.js process hosting both the HTTP application and Socket.IO.

```text
┌────────────────────────────────────────────────────┐
│                    Browser                          │
│  React UI                                           │
│  LobbyEntry → RoomLobby → GameArena                 │
│                     │                               │
│  DrawingCanvas · PlayerListSidebar · ChatPanel      │
│                     │                               │
│              Socket.IO client                       │
└─────────────────────┬──────────────────────────────┘
                      │ HTTP + WebSocket
┌─────────────────────▼──────────────────────────────┐
│                Node.js application                  │
│  Express                                           │
│   ├── GET /api/health                              │
│   ├── GET /api/rooms                                │
│   └── Vite middleware (development) / dist (prod)  │
│                                                    │
│  Socket.IO                                          │
│   └── MessageHandler                                │
│        └── RoomEntity                               │
│             ├── PlayerEntity                        │
│             └── GameManager                         │
└────────────────────────────────────────────────────┘
```

## 2. Frontend responsibilities

| Module | Responsibility |
|---|---|
| `src/App.tsx` | Top-level application and screen composition |
| `LobbyEntry.tsx` | Player entry, public room discovery, create/join room actions |
| `RoomLobby.tsx` | Room participants, ready state, room settings and host actions |
| `GameArena.tsx` | Main in-game layout and game phase presentation |
| `DrawingCanvas.tsx` | Canvas input, rendering, drawing controls and replay presentation |
| `PlayerListSidebar.tsx` | Participant list, scores, player status and moderation controls |
| `ChatPanel.tsx` | Guess input, chat messages and game feedback |
| `src/utils/socket.ts` | Socket.IO client connection and shared client access |
| `src/shared/types.ts` | Types shared between client and server |
| `src/shared/gameLogic.ts` | Deterministic word/guess helper logic |
| `src/shared/words.ts` | Categorized word data |

## 3. Backend responsibilities

### `server.ts`

Creates the Express application, HTTP server and Socket.IO server. It registers `MessageHandler`, exposes health and public-room endpoints, and serves Vite middleware in development or the compiled `dist/` directory in production.

### `PlayerEntity` — `server/Player.ts`

Represents a participant and their player-level state, such as identity, score, readiness, guessing status and moderation/vote state.

### `GameManager` — `server/Game.ts`

Owns game progression and authoritative round behavior, including:

- Game phases and round transitions.
- Drawer/turn selection.
- Word selection and hidden-word state.
- Round timer and hint progression.
- Guess scoring and score tracking.
- Drawing stroke history used by replay.

### `RoomEntity` — `server/Room.ts`

Owns a room's settings and participants, room-level actions, chat/guess evaluation, and player-specific game-state snapshots. It is responsible for not exposing the secret answer to players who are guessing.

### `MessageHandler` — `server/MessageHandler.ts`

Connects Socket.IO events to room operations. It handles room lifecycle and socket registration/cleanup.

## 4. Authoritative state

The server should be treated as the source of truth for:

- Room membership and permissions.
- The current game phase and drawer.
- The selected secret word.
- Timer and round progression.
- Guess validation and score awards.
- Moderation actions.

The browser renders state received from the server and sends player actions. It should not independently award points or decide that a guess is correct.

## 5. Drawing data flow

1. The drawer interacts with the HTML5 Canvas.
2. The client converts pointer positions to normalized canvas coordinates where implemented.
3. Drawing events are sent through Socket.IO.
4. The server validates the sender's room/role and relays the drawing data to room participants.
5. Each client renders the received stroke on its canvas.
6. The server-side drawing history supports replay and state recovery where implemented.

The canvas is a visual surface; the multiplayer transport sends drawing data rather than streaming a video of the canvas.

## 6. Guess and scoring flow

1. A guesser submits text through the chat/guess interface.
2. The server receives the guess and evaluates it against the active word using shared game logic.
3. The server emits the guess result and relevant chat/game notifications.
4. Correct guesses update player/drawer scores according to the game rules.
5. Updated scores are sent to clients for leaderboard rendering.

The server must not send the secret word in the general state payload to guessers.

## 7. Game lifecycle

The implementation uses game phases managed by `GameManager`. The intended lifecycle is:

```text
Lobby
  ↓ host starts
Choosing word
  ↓ drawer selects
Drawing
  ↓ word guessed or timer expires
Round end
  ↓ next drawer / next round
Choosing word
  ...
Game over
```

The exact phase names and transition guards are implemented in `server/Game.ts`.

## 8. Scaling and deployment considerations

- The current in-memory room/game model is suitable for a single running server instance and educational/demo deployment.
- Multiple server instances require shared room state and a Socket.IO adapter (for example, Redis) so users in the same room can reach the same authoritative state.
- A process restart clears in-memory rooms and games.
- Use a persistent Node.js host for the combined Express + Socket.IO service.
- If frontend and backend are split across origins, configure an explicit allowed origin and client server URL.
- For production use, add rate limits, stronger player identity, input validation, abuse controls and persistent moderation records.

## 9. Related source files

- Server entry: `server.ts`
- Socket event routing: `server/MessageHandler.ts`
- Room model: `server/Room.ts`
- Game model: `server/Game.ts`
- Player model: `server/Player.ts`
- Client socket: `src/utils/socket.ts`
- Shared types: `src/shared/types.ts`
