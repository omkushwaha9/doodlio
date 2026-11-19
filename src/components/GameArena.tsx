import React, { useState } from 'react';
import { Check, Copy, LogOut, Volume2, VolumeX } from 'lucide-react';
import type { DrawStroke, GameStateSnapshot } from '../shared/types';
import { ChatPanel } from './ChatPanel';
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas';
import { PlayerListSidebar } from './PlayerListSidebar';
import { SkribblClock, SkribblLogo } from './SkribblAssets';

interface GameArenaProps {
  gameState: GameStateSnapshot;
  canvasRef: React.RefObject<DrawingCanvasHandle | null>;
  isMuted: boolean;
  onToggleMute: () => void;
  onChooseWord: (word: string) => void;
  onDrawStart: (stroke: DrawStroke) => void;
  onDrawMove: (strokeId: string, x: number, y: number) => void;
  onDrawEnd: (strokeId: string) => void;
  onUndo: () => void;
  onClear: () => void;
  onSendMessage: (text: string) => void;
  onKickPlayer: (targetId: string) => void;
  onVotekickPlayer: (targetId: string) => void;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  gameState,
  canvasRef,
  isMuted,
  onToggleMute,
  onChooseWord,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onUndo,
  onClear,
  onSendMessage,
  onKickPlayer,
  onVotekickPlayer,
  onPlayAgain,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const selfPlayer = gameState.players.find((p) => p.id === gameState.selfId);
  const isDrawer = gameState.drawerId === gameState.selfId;
  const isHost = Boolean(selfPlayer?.isHost);
  const isLowTime = gameState.phase === 'drawing' && gameState.timeLeft <= 10;

  const handleCopyCode = async () => {
    const url = `${window.location.origin}/?room=${gameState.roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const renderWordDisplay = (includeTestIds: boolean) => {
    if (gameState.phase === 'drawing' && isDrawer && gameState.secretWord) {
      return (
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">
            DRAW THIS
          </span>
          <span
            data-testid={includeTestIds ? 'secret-word' : undefined}
            className="font-mono text-lg sm:text-xl font-bold tracking-wide text-[#111827]"
          >
            {gameState.secretWord}
          </span>
        </div>
      );
    }

    if (gameState.phase === 'drawing' && !isDrawer) {
      return (
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">
            GUESS THIS
          </span>
          <div className="flex items-baseline gap-2">
            <span
              data-testid={includeTestIds ? 'word-mask' : undefined}
              className="font-mono text-lg sm:text-xl font-bold tracking-[0.18em] text-[#111827] whitespace-pre"
            >
              {gameState.wordMask}
            </span>
            {gameState.settings.wordMode !== 'hidden' && gameState.wordLength > 0 && (
              <span className="text-xs font-mono font-bold tabular-nums text-[#4B5563]">
                {gameState.wordLength}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (gameState.phase === 'choosing') {
      return (
        <span className="font-mono text-sm font-bold uppercase tracking-wider text-[#374151]">
          {isDrawer ? 'CHOOSE A WORD' : 'CHOOSING WORD'}
        </span>
      );
    }

    if (gameState.phase === 'round_end' && gameState.secretWord) {
      return (
        <span className="font-mono text-base font-bold text-[#111827]">
          WORD: {gameState.secretWord}
        </span>
      );
    }

    if (gameState.phase === 'game_over') {
      return (
        <span className="font-mono text-sm font-bold uppercase tracking-wider text-[#111827]">
          GAME OVER
        </span>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col px-3 sm:px-6 py-2.5 max-w-[1320px] w-full mx-auto">
      {/* Top skribbl Logo & Audio/Leave bar */}
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <SkribblLogo size="sm" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy invite link"
            className="h-8 px-2.5 rounded-[3px] bg-white/15 hover:bg-white/25 text-xs font-mono font-bold text-white inline-flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#53E237]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{gameState.roomId}</span>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            className="h-8 w-8 rounded-[3px] bg-white/15 hover:bg-white/25 text-white inline-flex items-center justify-center transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label="Leave room"
            className="h-8 px-2.5 rounded-[3px] bg-white/15 hover:bg-[#DC2626] text-xs font-bold text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* White skribbl.io Top Game Bar */}
      <header className="bg-white text-[#111827] rounded-[3px] px-3 sm:px-4 h-12 shrink-0 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 shrink-0">
          <SkribblClock timeLeft={gameState.timeLeft} lowTime={isLowTime} />
          <span className="text-sm sm:text-base font-extrabold text-[#111827] tabular-nums">
            Round {gameState.round} of {gameState.totalRounds}
          </span>
        </div>

        <div className="hidden sm:flex flex-1 items-center justify-center min-w-0">
          {renderWordDisplay(true)}
        </div>

        <div className="text-xs font-bold text-[#6B7280] shrink-0 hidden sm:block">
          {gameState.settings.category}
        </div>
      </header>

      {/* Mobile Word Strip */}
      <div className="sm:hidden bg-white text-[#111827] rounded-[3px] mt-1.5 px-3 py-1.5 flex items-center justify-center shadow-sm">
        {renderWordDisplay(false)}
      </div>

      {/* 3-Column skribbl.io Game Workspace */}
      <main className="mt-2.5 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[210px_1fr_280px] gap-2.5 items-stretch">
        <div className="order-2 lg:order-1 min-h-0 flex flex-col">
          <PlayerListSidebar
            players={gameState.players}
            selfId={gameState.selfId}
            drawerId={gameState.drawerId}
            onKickPlayer={onKickPlayer}
            onVotekickPlayer={onVotekickPlayer}
          />
        </div>

        <div className="order-1 lg:order-2 flex flex-col justify-start min-w-0">
          <DrawingCanvas
            ref={canvasRef}
            gameState={gameState}
            isDrawer={isDrawer}
            isHost={isHost}
            onChooseWord={onChooseWord}
            onDrawStart={onDrawStart}
            onDrawMove={onDrawMove}
            onDrawEnd={onDrawEnd}
            onUndo={onUndo}
            onClear={onClear}
            onPlayAgain={onPlayAgain}
            onLeaveRoom={onLeaveRoom}
          />
        </div>

        <div className="order-3 min-h-0 flex flex-col">
          <ChatPanel
            messages={gameState.messages}
            phase={gameState.phase}
            isDrawer={isDrawer}
            hasGuessed={Boolean(selfPlayer?.hasGuessed)}
            isSpectator={Boolean(selfPlayer?.isSpectator)}
            onSendMessage={onSendMessage}
          />
        </div>
      </main>
    </div>
  );
};
