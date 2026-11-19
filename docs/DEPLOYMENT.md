# Deployment Guide

## Recommended: Render Web Service

Doodlio serves its React build and Socket.IO backend from one Express server. Deploying both together avoids cross-origin configuration for the standard setup.

### Before deploying

1. Confirm the project installs locally with `npm install`.
2. Run `npm run lint`, `npm test`, and `npm run build`.
3. Push the project to a Git repository.
4. Confirm that `render.yaml` is at the repository root.

### Deploy with Blueprint

1. Open the Render dashboard.
2. Select **New → Blueprint**.
3. Connect the repository.
4. Render reads `render.yaml`.
5. Create the service and wait for deployment.

The included Blueprint configures:

| Setting | Value |
|---|---|
| Service type | Web Service |
| Runtime | Node |
| Build | `npm install && npm run build` |
| Start | `npm start` |
| Health check | `/api/health` |
| Environment | `NODE_ENV=production` |

Render assigns `PORT` automatically. `server.ts` reads `process.env.PORT`.

### Verify the deployment

Open `https://<service-name>.onrender.com/api/health`. A healthy response should be JSON with `ok: true`.

Then test the game from two different browser sessions:

1. Create a room in browser A.
2. Join that room from browser B.
3. Start the game.
4. Select a word as drawer.
5. Draw several strokes and confirm browser B receives them.
6. Submit a correct guess from browser B.
7. Confirm scores and round progression update on both browsers.
8. Complete a game and confirm the final leaderboard.

Do not submit a deployment URL until this test passes.

## Railway

Create a Node service from the repository:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variable: `NODE_ENV=production`
- Expose the service's HTTP port and enable a public domain.

The app reads the platform-provided `PORT`.

## Vercel / Netlify

These are primarily frontend platforms. The app's Socket.IO server must run on a separate persistent Node host. If splitting the deployment:

- Set the client to connect to the backend's public URL.
- Configure explicit CORS origins on the backend.
- Use HTTPS/WSS.
- Verify WebSocket upgrade and fallback behavior.
- Do not assume a serverless function can host a long-lived Socket.IO server.

## Production checklist

- [ ] `npm install` completes.
- [ ] `npm run lint` completes.
- [ ] `npm test` completes.
- [ ] `npm run build` completes.
- [ ] `/api/health` responds successfully.
- [ ] Public room list endpoint responds.
- [ ] Create/join room works from separate browsers.
- [ ] Drawing sync works.
- [ ] Guess and score flow works.
- [ ] Round timer and next drawer work.
- [ ] Game-over leaderboard works.
- [ ] README contains the real public URL.
