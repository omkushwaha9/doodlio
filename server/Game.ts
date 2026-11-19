import {
  buildLeaderboard,
  buildWordMask,
  calculateDrawerPoints,
  calculateGuessPoints,
  evaluateGuess,
  pickHintRevealIndex,
  selectWordChoices,
} from '../src/shared/gameLogic.ts';
import type {
  DrawStroke,
  GamePhase,
  LeaderboardEntry,
  RoomSettings,
} from '../src/shared/types.ts';
import type { PlayerEntity } from './Player.ts';

export interface GameCallbacks {
  onStateChange: () => void;
  onTick: (timeLeft: number, wordMask: string) => void;
  onRoundStart: (drawerId: string, drawTime: number) => void;
  onGuessCorrect: (player: PlayerEntity, points: number) => void;
  onRoundEnd: (word: string, nextDrawerId: string | null, reason: 'all_guessed' | 'time_up' | 'drawer_left') => void;
  onGameOver: (winner: LeaderboardEntry | null, leaderboard: LeaderboardEntry[]) => void;
  onSystemMessage: (text: string) => void;
}

export class GameManager {
  public phase: GamePhase = 'lobby';
  public round = 0;
  public drawerId: string | null = null;
  public secretWord = '';
  public wordOptions: string[] = [];
  public revealedIndices: Set<number> = new Set();
  public timeLeft = 0;
  public strokes: DrawStroke[] = [];
  public lastRoundStrokes: DrawStroke[] = [];
  public roundEndReason: 'all_guessed' | 'time_up' | 'drawer_left' | null = null;

  private readonly callbacks: GameCallbacks;
  private turnOrder: string[] = [];
  private turnIndex = 0;
  private usedWords: Set<string> = new Set();
  private guessOrderCount = 0;
  private hintScheduleSeconds: number[] = [];
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private phaseTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: GameCallbacks) {
    this.callbacks = callbacks;
  }

  public destroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.phaseTimeoutHandle) {
      clearTimeout(this.phaseTimeoutHandle);
      this.phaseTimeoutHandle = null;
    }
  }

  public startGame(players: PlayerEntity[], settings: RoomSettings): boolean {
    const activePlayers = players.filter((p) => !p.isSpectator);
    if (activePlayers.length < 2) {
      return false;
    }

    this.clearTimers();
    this.usedWords.clear();
    this.round = 1;
    this.turnOrder = activePlayers.map((p) => p.id);
    this.turnIndex = 0;
    this.strokes = [];
    this.lastRoundStrokes = [];
    this.roundEndReason = null;

    for (const p of players) {
      p.resetForNewGame();
    }

    this.beginChoosingTurn(players, settings);
    return true;
  }

  public returnToLobby(players: PlayerEntity[]): void {
    this.clearTimers();
    this.phase = 'lobby';
    this.round = 0;
    this.drawerId = null;
    this.secretWord = '';
    this.wordOptions = [];
    this.revealedIndices.clear();
    this.timeLeft = 0;
    this.strokes = [];
    this.roundEndReason = null;
    for (const p of players) {
      p.resetForNewGame();
    }
    this.callbacks.onStateChange();
  }

  private beginChoosingTurn(players: PlayerEntity[], settings: RoomSettings): void {
    this.clearTimers();

    // Ensure drawer exists in active non-spectator players
    const activeIds = new Set(players.filter((p) => !p.isSpectator).map((p) => p.id));
    this.turnOrder = this.turnOrder.filter((id) => activeIds.has(id));
    for (const id of activeIds) {
      if (!this.turnOrder.includes(id)) {
        this.turnOrder.push(id);
      }
    }

    if (this.turnOrder.length < 2) {
      this.finishGame(players);
      return;
    }

    if (this.turnIndex >= this.turnOrder.length) {
      this.turnIndex = 0;
      this.round += 1;
    }

    if (this.round > settings.rounds) {
      this.finishGame(players);
      return;
    }

    this.drawerId = this.turnOrder[this.turnIndex];
    this.phase = 'choosing';
    this.secretWord = '';
    this.revealedIndices.clear();
    this.strokes = [];
    this.guessOrderCount = 0;
    this.roundEndReason = null;

    for (const p of players) {
      p.resetForNewRound();
    }

    this.wordOptions = selectWordChoices(
      settings.category,
      settings.customWords,
      settings.wordCount,
      this.usedWords,
      Math.random,
      settings.wordMode
    );

    const drawer = players.find((p) => p.id === this.drawerId);
    if (drawer) {
      this.callbacks.onSystemMessage(`Round ${this.round} of ${settings.rounds}: ${drawer.name} is choosing a word.`);
    }

    // 15 seconds to pick a word; auto-pick first option if drawer takes too long
    this.timeLeft = 15;
    this.callbacks.onRoundStart(this.drawerId, settings.drawTime);
    this.callbacks.onStateChange();

    this.timerHandle = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      this.callbacks.onTick(this.timeLeft, this.getWordMask(settings));
      if (this.timeLeft <= 0 && this.wordOptions.length > 0) {
        this.chooseWord(this.drawerId!, this.wordOptions[0], players, settings);
      }
    }, 1000);
  }

  public chooseWord(
    playerId: string,
    word: string,
    players: PlayerEntity[],
    settings: RoomSettings
  ): boolean {
    if (this.phase !== 'choosing' || playerId !== this.drawerId) {
      return false;
    }
    const chosen = this.wordOptions.find((w) => w.toLowerCase() === word.trim().toLowerCase());
    if (!chosen) {
      return false;
    }

    this.clearTimers();
    this.secretWord = chosen;
    this.usedWords.add(chosen);
    this.wordOptions = [];
    this.revealedIndices.clear();
    this.strokes = [];
    this.phase = 'drawing';
    this.timeLeft = settings.drawTime;

    // Schedule evenly spaced hint reveals during the drawing phase
    this.hintScheduleSeconds = [];
    if (settings.hints > 0 && settings.drawTime >= 15) {
      const interval = settings.drawTime / (settings.hints + 1);
      for (let i = 1; i <= settings.hints; i++) {
        const triggerAt = Math.max(3, Math.round(settings.drawTime - interval * i));
        this.hintScheduleSeconds.push(triggerAt);
      }
    }

    const drawer = players.find((p) => p.id === this.drawerId);
    if (drawer) {
      this.callbacks.onSystemMessage(`${drawer.name} started drawing!`);
    }

    this.callbacks.onStateChange();

    this.timerHandle = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);

      if (this.hintScheduleSeconds.includes(this.timeLeft)) {
        const nextIdx = pickHintRevealIndex(this.secretWord, this.revealedIndices);
        if (nextIdx !== null) {
          this.revealedIndices.add(nextIdx);
        }
      }

      this.callbacks.onTick(this.timeLeft, this.getWordMask(settings));

      if (this.timeLeft <= 0) {
        this.endRound('time_up', players, settings);
      }
    }, 1000);

    return true;
  }

  public submitGuess(
    player: PlayerEntity,
    text: string,
    players: PlayerEntity[],
    settings: RoomSettings
  ): { result: 'exact' | 'close' | 'miss'; points: number } | null {
    if (this.phase !== 'drawing') return null;
    if (player.id === this.drawerId || player.isSpectator || player.hasGuessed) return null;

    const evaluation = evaluateGuess(text, this.secretWord);
    if (evaluation === 'exact') {
      const points = calculateGuessPoints(this.timeLeft, settings.drawTime, this.guessOrderCount);
      this.guessOrderCount += 1;
      player.hasGuessed = true;
      player.roundScore += points;
      player.score += points;

      this.callbacks.onGuessCorrect(player, points);

      // Check if all active guessers have guessed
      const activeGuessers = players.filter((p) => !p.isSpectator && p.id !== this.drawerId);
      const allGuessed = activeGuessers.length > 0 && activeGuessers.every((p) => p.hasGuessed);

      if (allGuessed) {
        this.endRound('all_guessed', players, settings);
      } else {
        this.callbacks.onStateChange();
      }
      return { result: 'exact', points };
    }

    return { result: evaluation, points: 0 };
  }

  public startStroke(playerId: string, stroke: DrawStroke): boolean {
    if (this.phase !== 'drawing' || playerId !== this.drawerId) return false;
    if (this.strokes.some((s) => s.id === stroke.id)) return false;
    this.strokes.push(stroke);
    return true;
  }

  public appendStrokePoint(playerId: string, strokeId: string, x: number, y: number): boolean {
    if (this.phase !== 'drawing' || playerId !== this.drawerId) return false;
    const stroke = this.strokes.find((s) => s.id === strokeId);
    if (!stroke) return false;
    stroke.points.push({ x, y });
    return true;
  }

  public undoStroke(playerId: string): boolean {
    if (this.phase !== 'drawing' || playerId !== this.drawerId) return false;
    if (this.strokes.length === 0) return false;
    this.strokes.pop();
    return true;
  }

  public clearCanvas(playerId: string): boolean {
    if (this.phase !== 'drawing' || playerId !== this.drawerId) return false;
    this.strokes = [];
    return true;
  }

  public handlePlayerRemoved(playerId: string, players: PlayerEntity[], settings: RoomSettings): void {
    this.turnOrder = this.turnOrder.filter((id) => id !== playerId);

    const activePlayers = players.filter((p) => !p.isSpectator);
    if (this.phase !== 'lobby' && this.phase !== 'game_over' && activePlayers.length < 2) {
      this.finishGame(players);
      return;
    }

    if ((this.phase === 'choosing' || this.phase === 'drawing') && playerId === this.drawerId) {
      this.endRound('drawer_left', players, settings);
    }
  }

  private endRound(
    reason: 'all_guessed' | 'time_up' | 'drawer_left',
    players: PlayerEntity[],
    settings: RoomSettings
  ): void {
    this.clearTimers();
    this.phase = 'round_end';
    this.roundEndReason = reason;
    this.lastRoundStrokes = this.strokes.map((s) => ({
      ...s,
      points: [...s.points],
    }));

    // Award drawer points based on how many guessers succeeded
    const drawer = players.find((p) => p.id === this.drawerId);
    const activeGuessers = players.filter((p) => !p.isSpectator && p.id !== this.drawerId);
    const correctCount = activeGuessers.filter((p) => p.hasGuessed).length;

    if (drawer && reason !== 'drawer_left') {
      const drawerPts = calculateDrawerPoints(correctCount, activeGuessers.length);
      drawer.roundScore += drawerPts;
      drawer.score += drawerPts;
    }

    // Advance turn pointer
    if (reason !== 'drawer_left') {
      this.turnIndex += 1;
    }

    const nextRoundWillBe = this.turnIndex >= this.turnOrder.length ? this.round + 1 : this.round;
    const isLastTurn = nextRoundWillBe > settings.rounds;
    const nextDrawerId = isLastTurn
      ? null
      : this.turnOrder[this.turnIndex % Math.max(1, this.turnOrder.length)] ?? null;

    if (this.secretWord) {
      this.callbacks.onSystemMessage(`Round ended! The word was "${this.secretWord}".`);
    }

    this.callbacks.onRoundEnd(this.secretWord, nextDrawerId, reason);
    this.callbacks.onStateChange();

    // Pause 5 seconds to let players review round scores / replay, then advance
    this.timeLeft = 5;
    this.phaseTimeoutHandle = setTimeout(() => {
      if (isLastTurn) {
        this.finishGame(players);
      } else {
        this.beginChoosingTurn(players, settings);
      }
    }, 5000);
  }

  private finishGame(players: PlayerEntity[]): void {
    this.clearTimers();
    this.phase = 'game_over';
    this.drawerId = null;
    this.wordOptions = [];
    const leaderboard = buildLeaderboard(players.map((p) => p.toPublic()));
    const winner = leaderboard[0] ?? null;

    if (winner) {
      this.callbacks.onSystemMessage(`Game over! ${winner.name} wins with ${winner.score} points.`);
    }

    this.callbacks.onGameOver(winner, leaderboard);
    this.callbacks.onStateChange();
  }

  public getWordMask(settings: RoomSettings): string {
    if (!this.secretWord) return '';
    return buildWordMask(this.secretWord, this.revealedIndices, settings.wordMode);
  }
}
