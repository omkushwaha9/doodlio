
# Doodlio

A real-time multiplayer drawing and guessing game inspired by Skribbl.io.

Players can create or join a room, take turns drawing a secret word, and compete to guess correctly before the timer runs out.

## Live Demo

**Play Doodlio:** https://doodlio-lwhd.onrender.com/

**Source Code:** https://github.com/omkushwaha9/doodlio

## Features

- Multiplayer room-based gameplay
- Real-time drawing synchronization
- Turn-based drawing and word selection
- Guess submission and scoring
- Live player updates
- Game rounds and leaderboard
- Interactive drawing canvas
- Responsive user interface

## Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type-safe development |
| Vite | Frontend development and build |
| Node.js | Server runtime |
| Express.js | HTTP server |
| Socket.IO | Real-time multiplayer communication |
| HTML Canvas | Drawing functionality |

## Getting Started

### Prerequisites

- Node.js >= 22.12.0
- npm >= 11

### Installation

```bash
git clone https://github.com/omkushwaha9/doodlio.git
cd doodlio
npm install
```

### Run in Development

```bash
npm run dev
```

### Run in Production Mode

Build the frontend:

```bash
npm run build
```

Start the server:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the frontend for production |
| `npm start` | Starts the application server |
| `npm run lint` | Runs TypeScript checks |
| `npm test` | Runs the test suites |

## How to Play

1. Open the Doodlio website.
2. Create a room or join an existing room.
3. Wait for other players to join.
4. Start the game when the room is ready.
5. The selected drawer chooses a word.
6. Other players try to guess the word.
7. Players earn points for correct guesses.
8. The game continues through its configured rounds.
9. The player with the highest score wins.

## Project Documentation

Detailed documentation is available in the `docs/` directory:

- [Architecture](docs/ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [WebSocket Events](docs/WEBSOCKET-EVENTS.md)
- [Game Logic](docs/GAME-LOGIC.md)
- [Assignment Compliance](docs/ASSIGNMENT-COMPLIANCE.md)

## Testing

Run all tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Deployment

Doodlio is deployed on Render.

Live URL: https://doodlio-lwhd.onrender.com/

For deployment instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Future Improvements

Potential improvements include:

- Additional word categories
- More drawing tools
- Player avatars and customization
- Spectator mode
- Game replay functionality
- Additional moderation controls
