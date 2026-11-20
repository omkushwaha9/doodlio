
# Deployment Guide

## Production Environment

Doodlio is deployed using Render.

**Live Application:** https://doodlio-lwhd.onrender.com/

**Repository:** https://github.com/omkushwaha9/doodlio

## Deployment Configuration

The application uses a Node.js server with an Express backend and Socket.IO communication.

### Build Command

```bash
npm install && npm run build
```

### Start Command

```bash
npm start
```

### Node.js Version

The project requires Node.js >= 22.12.0.

## Environment Variables

Check the server configuration before adding environment variables.

| Variable | Purpose |
|---|---|
| `PORT` | Port used by the server |
| `NODE_ENV` | Application environment |

Only add variables that the application actually reads.

## Deployment Steps

1. Push the latest changes to GitHub.
2. Open the Doodlio service in Render.
3. Confirm the repository is connected.
4. Verify the build command.
5. Verify the start command.
6. Trigger a deployment.
7. Check the deployment logs.
8. Open the production URL.
9. Test room creation, joining, drawing, guessing, and scoring.

## Production Verification

After deployment, verify:

- The homepage loads successfully.
- Multiple players can connect.
- Room creation and joining work.
- Drawing updates synchronize.
- Guess submissions are processed.
- Scores update correctly.
- Round transitions work.
- The game can finish correctly.

## Important Notes

The deployed application should be tested independently from the local development environment.

A successful build does not automatically guarantee that multiplayer functionality works correctly in production.
