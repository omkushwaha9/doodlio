import type { PlayerPublic } from '../src/shared/types.ts';
import { AVATAR_PALETTE } from '../src/shared/gameLogic.ts';

export class PlayerEntity {
  public readonly id: string;
  public name: string;
  public score = 0;
  public roundScore = 0;
  public isHost: boolean;
  public isReady = false;
  public hasGuessed = false;
  public isSpectator: boolean;
  public readonly avatarColor: string;
  public votekicksFrom: Set<string> = new Set();

  constructor(params: {
    id: string;
    name: string;
    isHost: boolean;
    isSpectator?: boolean;
    colorIndex?: number;
  }) {
    this.id = params.id;
    this.name = params.name.trim().slice(0, 20) || 'Player';
    this.isHost = params.isHost;
    this.isReady = params.isHost;
    this.isSpectator = Boolean(params.isSpectator);
    const idx = (params.colorIndex ?? Math.floor(Math.random() * AVATAR_PALETTE.length)) % AVATAR_PALETTE.length;
    this.avatarColor = AVATAR_PALETTE[idx];
  }

  public resetForNewRound(): void {
    this.roundScore = 0;
    this.hasGuessed = false;
  }

  public resetForNewGame(): void {
    this.score = 0;
    this.roundScore = 0;
    this.hasGuessed = false;
    this.isReady = this.isHost;
  }

  public toPublic(): PlayerPublic {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      roundScore: this.roundScore,
      isHost: this.isHost,
      isReady: this.isReady,
      hasGuessed: this.hasGuessed,
      isSpectator: this.isSpectator,
      avatarColor: this.avatarColor,
      votekickCount: this.votekicksFrom.size,
    };
  }
}
