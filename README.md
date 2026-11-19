# Doodlio — Multiplayer Drawing & Guessing

Doodlio is a real-time multiplayer drawing and word-guessing game inspired by the classic online Pictionary format. Players create or join rooms, take turns drawing secret words, submit guesses in chat, earn points, and compete for the top position on the final leaderboard.

> **Project status:** The repository contains the application source, automated tests, and deployment configuration. A public production URL must be added after deployment; no live URL is claimed by this repository.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Tests and build](#tests-and-build)
- [Deploy to Render](#deploy-to-render)
- [Other deployment platforms](#other-deployment-platforms)
- [Architecture](#architecture)
- [Realtime event flow](#realtime-event-flow)
- [Game rules and configuration](#game-rules-and-configuration)
- [Assignment compliance notes](#assignment-compliance-notes)
- [Troubleshooting](#troubleshooting)
- [License and attribution](#license-and-attribution)

## Features

### Rooms and lobby

- Create configurable public or private rooms.
- Join a room using its room code or invitation URL.
- View the public room directory.
- Lobby player list and ready-state controls.
- Host controls for starting a game and managing participants.
- Spectator support.

### Gameplay

- Turn-based rounds with one drawer and other players guessing.
- The drawer chooses from a configurable list of word options.
- Normal, Hidden, and Combination word modes.
- Optional letter hints over the course of a round.
- Server-managed round timer, turn rotation, scoring, and game completion.
- Final leaderboard and winner presentation.

### Drawing

- HTML5 Canvas drawing surface.
- Live drawing-stroke synchronization through Socket.IO.
- Multiple ink colors and brush sizes.
- Brush and eraser tools.
- Undo the last stroke and clear the canvas.
- Round drawing history/replay support.

### Chat, guessing, and moderation

- Guess submission and server-side answer evaluation.
- Chat messages and game notifications.
- Correct-guess feedback and scoring.
- Host kick controls and votekick functionality.
- Backend ban handling is present; review the moderation UI and identity persistence before relying on bans in a public deployment.

### Known scope notes

- The assignment lists multiple word-list languages as a nice-to-have. The current project should be treated as using its implemented word bank; multilingual word-bank coverage is not claimed here.
- A report action is listed among the assignment's bonus moderation ideas but is not represented as a complete end-user workflow in this release.
- A separate Ban control and durable identity-based bans should be verified before describing moderation as fully complete.
- The public deployment URL is intentionally left blank until a deployment has been completed and tested.

## Technology stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite | Screens, interactions, application state |
| Styling | Tailwind CSS v4 | Layout and visual styling |
| Canvas | HTML5 Canvas API | Drawing and rendering strokes |
| Backend | Node.js, Express | HTTP server, API endpoints, static production hosting |
| Realtime | Socket.IO | Rooms, drawing, chat, guesses, and game-state broadcasts |
| Tests | TypeScript test files executed with `tsx` | Game logic and room/game behavior |

## Project structure

```text
doodlio/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   ├── ASSIGNMENT-COMPLIANCE.md
│   └── assignment-reference.pdf
├── public/
├── server/
│   ├── Game.ts
│   ├── MessageHandler.ts
│   ├── Player.ts
│   ├── Room.ts
│   └── roomGame.test.ts
├── src/
│   ├── components/
│   ├── shared/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── render.yaml
├── server.ts
├── tsconfig.json
└── vite.config.ts
```

## Run locally

### Prerequisites

- Node.js **22.12.0 or newer**
- npm (included with Node.js)
- Git (optional, for cloning)

### Install

```bash
git clone <YOUR_REPOSITORY_URL>
cd doodlio
npm install
```

If you downloaded the ZIP instead of cloning the repository, extract it and open the extracted `doodlio` folder in your terminal.

### Configure

Copy the example environment file:

```bash
cp .env.example .env
```

The application defaults to port `3000`. You can change `PORT` in `.env`.

### Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The Express server hosts the Vite development middleware and Socket.IO endpoint on the same origin.

## Environment variables

| Variable | Required | Default | Description |
|---|---:|---|---|
| `PORT` | No | `3000` locally | HTTP and Socket.IO server port. Hosting providers normally supply this automatically. |
| `NODE_ENV` | No | Development unless set | Use `production` for production hosting. |

Do not commit `.env` files or secrets. The current application does not require API keys for its core game flow.

## Tests and build

Run the game-logic tests:

```bash
npm run test:logic
```

Run the server room/game tests:

```bash
npm run test:server
```

Run both test groups:

```bash
npm test
```

Run the TypeScript check:

```bash
npm run lint
```

Create the production frontend bundle:

```bash
npm run build
```

Preview the built frontend with Vite:

```bash
npm run preview
```

For a production-like local run, build first and then start the Express server:

```bash
npm run build
NODE_ENV=production npm start
```

The production server serves the generated `dist/` directory and continues to host Socket.IO on the same HTTP server.

## Deploy to Render

The repository includes a `render.yaml` Blueprint for a single Render Web Service. A single service is appropriate here because Express serves the frontend build and Socket.IO from the same origin.

1. Push this project to a GitHub repository.
2. Sign in to Render and choose **New → Blueprint**.
3. Connect the repository containing `render.yaml`.
4. Review the service settings and create the service.
5. Wait for the build and deployment to complete.
6. Open the generated `https://<service-name>.onrender.com` URL.
7. Verify the health endpoint:
   `https://<service-name>.onrender.com/api/health`
8. Open the game in two separate browser sessions and test the complete multiplayer flow.

The Blueprint configures:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Runtime: Node.js
- Health check: `/api/health`
- `NODE_ENV=production`

Render's assigned `PORT` is read automatically by `server.ts`. Keep the frontend and Socket.IO backend on the same service/origin unless you deliberately configure cross-origin access.

### Production smoke test

Before sharing the deployment URL, verify:

- The homepage loads without console errors.
- A host can create a room.
- A second browser can join using the room code or invitation URL.
- The host can start a game.
- The drawer can select a word.
- Strokes appear on the other player's canvas in real time.
- A correct guess is accepted and scores update.
- The round ends and the next turn begins.
- The game-over screen shows the leaderboard and winner.
- Refreshing the page does not expose the secret word to guessers.

Add the verified public URL here after deployment:

**Live application:** `https://<your-render-service>.onrender.com`

Do not leave the placeholder in a final submission.

## Other deployment platforms

### Railway

Create a Node.js service from the repository.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Set `NODE_ENV=production`.
- Railway supplies the port; the server reads `process.env.PORT`.
- Enable a public domain and test WebSocket connectivity.

### Vercel or Netlify

These platforms are suitable for static frontend hosting, but this project also needs a persistent Socket.IO server. If using either platform for the frontend, deploy the backend separately to a WebSocket-capable Node.js host and configure the client/server origins and CORS deliberately. The simplest deployment for this repository is one Render or Railway service.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the detailed component and event flow.

At a high level:

1. React renders the lobby, room, drawing, chat, and leaderboard interfaces.
2. The Socket.IO client connects to the Express/Socket.IO server.
3. `MessageHandler` receives client events and routes them to room operations.
4. `RoomEntity` owns room membership, room settings, chat/guess handling, and player-specific state.
5. `GameManager` owns the authoritative game lifecycle, turn rotation, timers, hints, scores, and drawing history.
6. The server broadcasts permitted state updates to clients. The secret word must only be included in the drawer's private state/word-selection flow, not in guessers' public game state.

## Realtime event flow

The server and client use Socket.IO events for the multiplayer experience. The assignment's suggested event names are a reference; the implementation's actual event names and payloads are defined in `server/MessageHandler.ts`, `server/Room.ts`, `server/Game.ts`, and `src/utils/socket.ts`.

Typical flow:

```text
Browser A                  Doodlio server                  Browser B
   |                             |                              |
   |---- create/join room ------>|                              |
   |                             |<--------- join room ----------|
   |<------ room state ----------|---------- room state -------->|
   |                             |                              |
   |---- choose word ----------->|                              |
   |                             |---- round/game state -------->|
   |---- drawing strokes ------->|---- drawing broadcast ------>|
   |                             |                              |
   |                             |<----------- guess ------------|
   |                             |---- chat/guess result ------->|
   |<------ score/state ---------|---------- score/state ------->|
```

## Game rules and configuration

The room settings are intended to follow the assignment ranges:

| Setting | Assignment range |
|---|---:|
| Maximum players | 2–20 |
| Rounds | 2–10 |
| Drawing time | 15–240 seconds |
| Word choices per turn | 1–5 |
| Hints | 0–5 or disabled |
| Word modes | Normal, Hidden, Combination |

Check the actual room-settings controls and server-side validation together when modifying these values. The server must remain authoritative; client-side controls alone are not sufficient validation.

## Assignment compliance notes

The original assignment PDF is retained at [`docs/assignment-reference.pdf`](docs/assignment-reference.pdf).

The detailed requirement-by-requirement tracking is in [`docs/ASSIGNMENT-COMPLIANCE.md`](docs/ASSIGNMENT-COMPLIANCE.md). That document distinguishes features found in the source from items that still require UI completion or runtime verification.

## Troubleshooting

### `ERESOLVE` dependency error

Use the supplied `package.json` and install from a clean dependency state:

```bash
rm -rf node_modules package-lock.json
npm install
```

Do not use `--force` or `--legacy-peer-deps` as a permanent fix. If npm reports a new peer-dependency conflict, capture the complete error and resolve the incompatible package versions.

### Port already in use

Run on another port:

```bash
PORT=3001 npm run dev
```

Then open `http://localhost:3001`.

### App loads but multiplayer does not connect

- Check that the Express server is running.
- Check the browser Network tab for the Socket.IO connection.
- Confirm the browser is connecting to the same origin as the server.
- On split frontend/backend hosting, configure the backend URL and CORS rather than using a wildcard by default.

### Production page returns 404

Run `npm run build` and confirm that `dist/index.html` exists before starting with `NODE_ENV=production`.

## License and attribution

Doodlio is an educational project inspired by the drawing-and-guessing game format popularized by skribbl.io. It is not affiliated with or endorsed by skribbl.io. Use original project branding and assets; do not redistribute third-party logos, artwork, or other assets without permission.

No open-source license has been added to this repository. Add a `LICENSE` file only after choosing a license and confirming that you have the rights to license all included code and assets.
