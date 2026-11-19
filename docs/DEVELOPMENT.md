# Development Guide

## Requirements

- Node.js 22.12.0+
- npm

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app is available at `http://localhost:3000` by default.

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Express, Socket.IO and Vite development middleware |
| `npm start` | Start the server (use after building for production) |
| `npm run build` | Build the frontend into `dist/` |
| `npm run preview` | Preview the Vite build |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run test:logic` | Run shared game-logic tests |
| `npm run test:server` | Run server room/game tests |
| `npm test` | Run both test groups |

## Making changes safely

- Keep game rules and score decisions on the server.
- Preserve the event contracts used by `MessageHandler` and `src/utils/socket.ts`.
- Do not include the secret word in public state sent to guessers.
- Validate host-only and drawer-only actions on the server, not only by hiding UI controls.
- Test multiplayer changes with at least two independent browser sessions.
- Update `docs/ASSIGNMENT-COMPLIANCE.md` when a feature changes status.

## Debugging

- Browser console: frontend rendering and client socket errors.
- Terminal: Express, Socket.IO and server-side errors.
- Browser Network panel: Socket.IO polling/WebSocket connection.
- Health endpoint: `http://localhost:3000/api/health`.
