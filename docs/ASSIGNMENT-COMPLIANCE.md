
# Assignment Compliance

## Project

Doodlio — Multiplayer Drawing and Guessing Game

## Assignment Objective

Build a multiplayer drawing and guessing game with real-time communication, room management, drawing functionality, guessing, and scoring.

## Requirement Checklist

Use the status values:

- Implemented — feature is implemented and verified.
- Partial — some functionality exists, but the complete requirement is not satisfied.
- Not Implemented — feature is absent.

| Requirement | Status | Verification |
|---|---|---|
| Create a game room | Verify | Create a room |
| Join using room code or link | Verify | Join from another browser |
| Player list | Verify | Check lobby |
| Multiplayer gameplay | Verify | Connect multiple clients |
| Turn-based drawing | Verify | Complete multiple turns |
| Word selection | Verify | Start a drawing turn |
| Real-time drawing synchronization | Verify | Draw from one client |
| Guess submission | Verify | Submit a correct guess |
| Scoring system | Verify | Check score updates |
| Leaderboard | Verify | Complete a game |
| Game completion | Verify | Finish configured rounds |
| Drawing tools | Verify | Test available tools |
| Timer | Verify | Observe round countdown |
| Chat | Verify | Test chat functionality |
| Hints | Verify | Test hint functionality |
| Private rooms | Verify | Test room privacy |

Replace every `Verify` entry with the correct status after testing.

## Testing Results

| Test | Result |
|---|---|
| TypeScript checks (`npm run lint`) | Passed |
| Game logic tests | Passed |
| Server tests | Passed |
| Production build (`npm run build`) | Passed |
| Full multiplayer browser testing | Pending verification |
| Production deployment testing | Pending verification |

## Known Limitations

List any incomplete features, known bugs, or deployment constraints here.

## Conclusion

Doodlio implements a multiplayer drawing and guessing game using a React frontend, Node.js server, and Socket.IO for real-time communication.

The final compliance status should reflect the features that have been verified in the running application.
