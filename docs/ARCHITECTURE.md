
# Doodlio — System Architecture

## 1. Overview

Doodlio is a real-time multiplayer drawing and guessing game.

The application uses a client-server architecture. The frontend handles the user interface and drawing interactions, while the backend manages rooms, players, game state, and real-time communication.

## 2. Technology Stack

- React and TypeScript — frontend
- Vite — frontend build tooling
- Node.js — backend runtime
- Express.js — HTTP server
- Socket.IO — real-time communication
- HTML Canvas — drawing interface

## 3. High-Level Architecture

```text
             PLAYER 1
                 |
                 v
          React Frontend
                 |
                 | Socket.IO
                 |
                 v
        Node.js / Express Server
                 |
          Socket.IO Event Handlers
                 |
          Game and Room Logic
                 |
          Shared Room State
                 |
          +------+------+
          |             |
          v             v
       PLAYER 2      PLAYER 3
       Frontend      Frontend
```

## 4. Frontend Responsibilities

The frontend is responsible for:

- Rendering the game interface.
- Creating and joining rooms.
- Displaying the player list.
- Rendering the drawing canvas.
- Capturing drawing interactions.
- Sending guesses to the server.
- Displaying scores, timers, and game updates.

## 5. Backend Responsibilities

The backend is responsible for:

- Creating and managing rooms.
- Handling player connections.
- Managing room membership.
- Controlling game rounds and turns.
- Processing guesses.
- Updating scores.
- Broadcasting game updates to connected players.

## 6. Backend Components

The backend is organized into separate classes:

### MessageHandler

Located at `server/MessageHandler.ts`.

- Registers Socket.IO event listeners.
- Handles room creation and joining.
- Routes player actions to the appropriate room.
- Tracks socket-to-room associations.
- Handles player disconnections.

### RoomEntity

Located at `server/Room.ts`.

- Maintains room settings and player membership.
- Handles player readiness and host permissions.
- Manages drawing and chat updates.
- Coordinates game-state broadcasting.
- Handles player removal, kicking and voting.

### GameManager

Located at `server/Game.ts`.

- Controls game phases and round progression.
- Manages word selection and drawing turns.
- Processes guesses and scoring.
- Controls timers and hints.
- Generates the final leaderboard.

### PlayerEntity

Located at `server/Player.ts`.

- Stores player identity and nickname.
- Tracks scores and readiness.
- Maintains spectator status.
- Stores host and guessing information.

## 6. Real-Time Communication

Socket.IO enables bidirectional communication between the frontend and backend.

When a player performs an action, the client sends an event to the server. The server processes the action and broadcasts the appropriate update to the relevant room.

Examples include:

- Player joining a room
- Drawing updates
- Guess submissions
- Round changes
- Score updates

See [WEBSOCKET-EVENTS.md](WEBSOCKET-EVENTS.md) for the event reference.

## 7. Drawing Data Flow

1. The drawer interacts with the canvas.
2. The frontend captures the drawing input.
3. Drawing data is transmitted to the server.
4. The server distributes the update to other players.
5. Other clients render the received drawing data.

## 8. Game State

The game state includes information such as:

- Current room
- Connected players
- Current drawer
- Current round
- Selected word
- Remaining time
- Player scores
- Game status

The server should remain authoritative for game progression and scoring.

## 9. Deployment

The application is deployed on Render.

Production URL: https://doodlio-lwhd.onrender.com/
