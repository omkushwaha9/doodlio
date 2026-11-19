import type { Server } from 'socket.io';
import {
  buildLeaderboard,
  sanitizeRoomSettings,
} from '../src/shared/gameLogic.ts';
import type {
  ChatMessage,
  DrawStroke,
  GameStateSnapshot,
  PublicRoomSummary,
  RoomSettings,
} from '../src/shared/types.ts';
import { GameManager } from './Game.ts';
import { PlayerEntity } from './Player.ts';

export class RoomEntity {
  public readonly roomId: string;
  public settings: RoomSettings;
  public readonly players: Map<string, PlayerEntity> = new Map();
  public readonly messages: ChatMessage[] = [];
  public readonly bannedNames: Set<string> = new Set();
  public readonly game: GameManager;

  private readonly io: Server | null;
  private colorCounter = 0;

  constructor(
    roomId: string,
    settingsInput: Partial<RoomSettings> | undefined,
    io: Server | null
  ) {
    this.roomId = roomId;
    this.io = io;
    this.settings = sanitizeRoomSettings(settingsInput);
    this.game = new GameManager({
      onStateChange: () => this.broadcastState(),
      onTick: (timeLeft, wordMask) => {
        this.io?.to(this.roomId).emit('timer_tick', { timeLeft, wordMask });
      },
      onRoundStart: (drawerId, drawTime) => {
        for (const player of this.players.values()) {
          this.io?.to(player.id).emit('round_start', {
            round: this.game.round,
            drawerId,
            wordOptions: player.id === drawerId ? this.game.wordOptions : [],
            drawTime,
          });
        }
      },
      onGuessCorrect: (player, points) => {
        const msg = this.pushMessage({
          playerId: player.id,
          playerName: player.name,
          text: `${player.name} guessed the word! (+${points} pts)`,
          type: 'guess_correct',
        });
        this.io?.to(this.roomId).emit('guess_result', {
          correct: true,
          playerId: player.id,
          playerName: player.name,
          points,
        });
        this.io?.to(this.roomId).emit('chat_message', msg);
      },
      onRoundEnd: (word, nextDrawerId, reason) => {
        this.io?.to(this.roomId).emit('round_end', {
          word,
          scores: Array.from(this.players.values()).map((p) => p.toPublic()),
          nextDrawerId,
          reason,
        });
      },
      onGameOver: (winner, leaderboard) => {
        this.io?.to(this.roomId).emit('game_over', { winner, leaderboard });
      },
      onSystemMessage: (text) => {
        this.pushMessage({
          playerId: 'system',
          playerName: 'System',
          text,
          type: 'system',
        });
      },
    });
  }

  public destroy(): void {
    this.game.destroy();
  }

  public addPlayer(id: string, name: string, isSpectator = false): { ok: boolean; error?: string; player?: PlayerEntity } {
    const cleanName = name.trim().slice(0, 20);
    if (!cleanName) {
      return { ok: false, error: 'Please enter a nickname.' };
    }
    if (this.bannedNames.has(cleanName.toLowerCase())) {
      return { ok: false, error: 'You are banned from this room.' };
    }
    const activeCount = Array.from(this.players.values()).filter((p) => !p.isSpectator).length;
    if (!isSpectator && activeCount >= this.settings.maxPlayers) {
      return { ok: false, error: 'Room is full.' };
    }

    const isHost = this.players.size === 0;
    const player = new PlayerEntity({
      id,
      name: cleanName,
      isHost,
      isSpectator,
      colorIndex: this.colorCounter++,
    });

    this.players.set(id, player);

    this.pushMessage({
      playerId: 'system',
      playerName: 'System',
      text: `${player.name} joined${isSpectator ? ' as spectator' : ''}.`,
      type: 'system',
    });

    this.io?.to(this.roomId).emit('player_joined', {
      player: player.toPublic(),
      players: this.getPublicPlayers(),
    });
    this.broadcastState();
    return { ok: true, player };
  }

  public removePlayer(id: string, reasonText?: string): void {
    const player = this.players.get(id);
    if (!player) return;

    this.players.delete(id);

    // Clear votekicks cast by this player
    for (const p of this.players.values()) {
      p.votekicksFrom.delete(id);
    }

    // Reassign host if needed
    if (player.isHost && this.players.size > 0) {
      const nextHost =
        Array.from(this.players.values()).find((p) => !p.isSpectator) ??
        Array.from(this.players.values())[0];
      if (nextHost) {
        nextHost.isHost = true;
        nextHost.isReady = true;
        this.pushMessage({
          playerId: 'system',
          playerName: 'System',
          text: `${nextHost.name} is now the room host.`,
          type: 'system',
        });
      }
    }

    this.pushMessage({
      playerId: 'system',
      playerName: 'System',
      text: reasonText ?? `${player.name} left the room.`,
      type: 'system',
    });

    this.game.handlePlayerRemoved(id, Array.from(this.players.values()), this.settings);

    this.io?.to(this.roomId).emit('player_left', {
      playerId: id,
      players: this.getPublicPlayers(),
    });
    this.broadcastState();
  }

  public toggleReady(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player || player.isHost || player.isSpectator || this.game.phase !== 'lobby') return;
    player.isReady = !player.isReady;
    this.broadcastState();
  }

  public updateSettings(playerId: string, nextSettings: Partial<RoomSettings>): boolean {
    const player = this.players.get(playerId);
    if (!player || !player.isHost || this.game.phase !== 'lobby') return false;
    this.settings = sanitizeRoomSettings({ ...this.settings, ...nextSettings });
    this.broadcastState();
    return true;
  }

  public startGame(playerId: string): { ok: boolean; error?: string } {
    const player = this.players.get(playerId);
    if (!player || !player.isHost) {
      return { ok: false, error: 'Only the host can start the game.' };
    }
    if (this.game.phase !== 'lobby' && this.game.phase !== 'game_over') {
      return { ok: false, error: 'Game already in progress.' };
    }
    const activePlayers = Array.from(this.players.values()).filter((p) => !p.isSpectator);
    if (activePlayers.length < 2) {
      return { ok: false, error: 'At least 2 players are required to start.' };
    }
    const started = this.game.startGame(Array.from(this.players.values()), this.settings);
    return started ? { ok: true } : { ok: false, error: 'Unable to start game.' };
  }

  public playAgain(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player || !player.isHost) return;
    this.game.returnToLobby(Array.from(this.players.values()));
  }

  public kickPlayer(hostId: string, targetId: string, ban = false): boolean {
    const host = this.players.get(hostId);
    const target = this.players.get(targetId);
    if (!host || !host.isHost || !target || hostId === targetId) return false;

    if (ban) {
      this.bannedNames.add(target.name.toLowerCase());
    }
    this.io?.to(targetId).emit('kicked', {
      reason: ban ? 'You were banned by the host.' : 'You were removed by the host.',
    });
    this.removePlayer(targetId, `${target.name} was removed by the host.`);
    return true;
  }

  public votekickPlayer(voterId: string, targetId: string): { kicked: boolean; votes: number; needed: number } | null {
    const voter = this.players.get(voterId);
    const target = this.players.get(targetId);
    if (!voter || !target || voter.isSpectator || voterId === targetId) return null;

    target.votekicksFrom.add(voterId);
    const activeVoters = Array.from(this.players.values()).filter((p) => !p.isSpectator && p.id !== targetId);
    const needed = Math.max(2, Math.ceil(activeVoters.length / 2));

    if (target.votekicksFrom.size >= needed) {
      this.io?.to(targetId).emit('kicked', { reason: 'You were votekicked from the room.' });
      this.removePlayer(targetId, `${target.name} was votekicked.`);
      return { kicked: true, votes: target.votekicksFrom.size, needed };
    }

    this.pushMessage({
      playerId: 'system',
      playerName: 'System',
      text: `${voter.name} voted to kick ${target.name} (${target.votekicksFrom.size}/${needed}).`,
      type: 'system',
    });
    this.broadcastState();
    return { kicked: false, votes: target.votekicksFrom.size, needed };
  }

  public handleGuess(playerId: string, text: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const trimmed = text.trim().slice(0, 120);
    if (!trimmed) return;

    // During drawing phase, check guess for eligible guessers
    if (this.game.phase === 'drawing' && playerId !== this.game.drawerId && !player.hasGuessed && !player.isSpectator) {
      const outcome = this.game.submitGuess(player, trimmed, Array.from(this.players.values()), this.settings);
      if (outcome?.result === 'exact') {
        return;
      }

      if (outcome?.result === 'close') {
        // Send private "close guess" feedback to the guesser only, without leaking to others
        const closeMsg: ChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          playerId: 'system',
          playerName: 'System',
          text: `"${trimmed}" is close!`,
          type: 'guess_close',
          timestamp: Date.now(),
        };
        this.io?.to(playerId).emit('chat_message', closeMsg);
        this.io?.to(playerId).emit('guess_result', {
          correct: false,
          close: true,
          playerId: player.id,
          playerName: player.name,
          points: 0,
        });
        return;
      }
    }

    // Prevent drawer or already-guessed players from spoiling secret word in chat
    if (
      this.game.phase === 'drawing' &&
      (playerId === this.game.drawerId || player.hasGuessed) &&
      this.game.secretWord &&
      trimmed.toLowerCase().includes(this.game.secretWord.toLowerCase())
    ) {
      this.io?.to(playerId).emit('chat_message', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        playerId: 'system',
        playerName: 'System',
        text: 'Message blocked: do not reveal the secret word.',
        type: 'system',
        timestamp: Date.now(),
      });
      return;
    }

    const msg = this.pushMessage({
      playerId: player.id,
      playerName: player.name,
      text: trimmed,
      type: 'chat',
    });
    this.io?.to(this.roomId).emit('chat_message', msg);
  }

  public handleDrawStart(playerId: string, stroke: DrawStroke): void {
    if (!this.game.startStroke(playerId, stroke)) return;
    this.io?.to(this.roomId).emit('draw_data', { action: 'start', stroke });
  }

  public handleDrawMove(playerId: string, strokeId: string, x: number, y: number): void {
    if (!this.game.appendStrokePoint(playerId, strokeId, x, y)) return;
    this.io?.to(this.roomId).emit('draw_data', { action: 'move', strokeId, x, y });
  }

  public handleDrawEnd(playerId: string, strokeId: string): void {
    if (this.game.phase !== 'drawing' || playerId !== this.game.drawerId) return;
    this.io?.to(this.roomId).emit('draw_data', { action: 'end', strokeId });
  }

  public handleCanvasClear(playerId: string): void {
    if (!this.game.clearCanvas(playerId)) return;
    this.io?.to(this.roomId).emit('canvas_clear', {});
  }

  public handleDrawUndo(playerId: string): void {
    if (!this.game.undoStroke(playerId)) return;
    this.io?.to(this.roomId).emit('draw_undo', { strokes: this.game.strokes });
  }

  private pushMessage(params: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      ...params,
    };
    this.messages.push(msg);
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    return msg;
  }

  public getPublicPlayers() {
    return Array.from(this.players.values()).map((p) => p.toPublic());
  }

  public getSnapshotFor(playerId: string): GameStateSnapshot {
    const isDrawer = playerId === this.game.drawerId;
    const publicPlayers = this.getPublicPlayers();
    const leaderboard = buildLeaderboard(publicPlayers);

    return {
      roomId: this.roomId,
      selfId: playerId,
      settings: this.settings,
      phase: this.game.phase,
      round: this.game.round,
      totalRounds: this.settings.rounds,
      drawerId: this.game.drawerId,
      wordMask: this.game.getWordMask(this.settings),
      wordLength: this.game.secretWord ? this.game.secretWord.length : 0,
      wordOptions: isDrawer && this.game.phase === 'choosing' ? this.game.wordOptions : [],
      secretWord:
        this.game.phase === 'round_end' || this.game.phase === 'game_over' || (isDrawer && this.game.phase === 'drawing')
          ? this.game.secretWord || null
          : null,
      timeLeft: this.game.timeLeft,
      players: publicPlayers,
      strokes: this.game.strokes,
      lastRoundStrokes: this.game.lastRoundStrokes,
      messages: this.messages,
      winner: this.game.phase === 'game_over' ? leaderboard[0] ?? null : null,
      leaderboard,
      roundEndReason: this.game.roundEndReason,
    };
  }

  public broadcastState(): void {
    if (!this.io) return;
    for (const player of this.players.values()) {
      this.io.to(player.id).emit('game_state', this.getSnapshotFor(player.id));
    }
  }

  public toPublicSummary(): PublicRoomSummary | null {
    if (this.settings.isPrivate || this.players.size === 0) return null;
    const host = Array.from(this.players.values()).find((p) => p.isHost) ?? Array.from(this.players.values())[0];
    const activeCount = Array.from(this.players.values()).filter((p) => !p.isSpectator).length;
    return {
      roomId: this.roomId,
      hostName: host?.name ?? 'Host',
      playerCount: activeCount,
      maxPlayers: this.settings.maxPlayers,
      phase: this.game.phase,
      rounds: this.settings.rounds,
      currentRound: this.game.round,
      category: this.settings.category,
    };
  }
}
