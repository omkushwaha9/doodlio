
# WebSocket Events

## Overview

Doodlio uses Socket.IO for real-time communication between players and the game server.

The server processes incoming events and sends updates to the relevant connected clients.

## Event Documentation

Document the actual event names from the source code in the following tables.

### Client-to-Server Events

| Event | Payload | Purpose |
|---|---|---|
| Create room | Actual payload | Creates a game room |
| Join room | Actual payload | Joins an existing room |
| Start game | Actual payload | Starts the game |
| Drawing update | Actual payload | Sends drawing data |
| Submit guess | Actual payload | Submits a player's guess |
| Chat message | Actual payload | Sends a chat message |

### Server-to-Client Events

| Event | Payload | Purpose |
|---|---|---|
| Room update | Actual payload | Updates room information |
| Player update | Actual payload | Updates player information |
| Game update | Actual payload | Updates game state |
| Drawing update | Actual payload | Synchronizes drawing data |
| Guess result | Actual payload | Communicates guess results |
| Round update | Actual payload | Updates round information |
| Game over | Actual payload | Communicates game completion |

## Event Flow

1. A client connects to the Socket.IO server.
2. The client emits an event.
3. The server validates and processes the event.
4. The server updates the relevant state.
5. The server emits the resulting update.
6. Connected clients update their interfaces.

## Error Handling

Document the actual error responses and invalid-event handling implemented in the server.

## Source Code Reference

- `server.ts` — Express and Socket.IO initialization.
- `server/MessageHandler.ts` — Incoming client events.
- `server/Room.ts` — Room management and outgoing events.
- `server/Game.ts` — Game progression and scoring.
- `src/App.tsx` — Client-side Socket.IO event listeners.
- `src/utils/socket.ts` — Client socket connection.
