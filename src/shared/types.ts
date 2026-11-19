export type WordMode = 'normal' | 'hidden' | 'combination';

export type GamePhase = 'lobby' | 'choosing' | 'drawing' | 'round_end' | 'game_over';

export type WordCategory =
  | 'All'
  | 'Animals'
  | 'Objects'
  | 'Food'
  | 'Nature'
  | 'Actions'
  | 'Places';

export interface RoomSettings {
  maxPlayers: number; // 2 - 20
  rounds: number; // 2 - 10
  drawTime: number; // 15 - 240 seconds
  wordCount: number; // 1 - 5 choices per turn
  hints: number; // 0 - 5 hint letters revealed over time
  wordMode: WordMode;
  isPrivate: boolean;
  category: WordCategory;
  customWords: string[];
}

export interface PlayerPublic {
  id: string;
  name: string;
  score: number;
  roundScore: number;
  isHost: boolean;
  isReady: boolean;
  hasGuessed: boolean;
  isSpectator: boolean;
  avatarColor: string;
  votekickCount: number;
}

export interface DrawPoint {
  x: number; // Normalized 0..1 relative to canvas width
  y: number; // Normalized 0..1 relative to canvas height
}

export interface DrawStroke {
  id: string;
  color: string;
  size: number; // Normalized brush width in 800px reference space (e.g. 2..24)
  isEraser: boolean;
  points: DrawPoint[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: 'chat' | 'guess_correct' | 'guess_close' | 'system';
  timestamp: number;
}

export interface PublicRoomSummary {
  roomId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
  rounds: number;
  currentRound: number;
  category: WordCategory;
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  score: number;
  rank: number;
  avatarColor: string;
}

export interface GameStateSnapshot {
  roomId: string;
  selfId: string;
  settings: RoomSettings;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  drawerId: string | null;
  wordMask: string;
  wordLength: number;
  wordOptions: string[]; // Non-empty only for the active drawer during 'choosing'
  secretWord: string | null; // Visible only to drawer during 'drawing', or to all in 'round_end'
  timeLeft: number;
  players: PlayerPublic[];
  strokes: DrawStroke[];
  lastRoundStrokes: DrawStroke[];
  messages: ChatMessage[];
  winner: LeaderboardEntry | null;
  leaderboard: LeaderboardEntry[];
  roundEndReason: 'all_guessed' | 'time_up' | 'drawer_left' | null;
}

export interface RoomErrorPayload {
  message: string;
}
