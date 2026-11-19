import React, { useState } from 'react';
import { Check, Copy, LogOut, Play } from 'lucide-react';
import { WORD_CATEGORIES } from '../shared/words';
import type { GameStateSnapshot, RoomSettings, WordCategory, WordMode } from '../shared/types';
import { ChatPanel } from './ChatPanel';
import { PlayerListSidebar } from './PlayerListSidebar';
import { SkribblClock, SkribblLogo } from './SkribblAssets';

interface RoomLobbyProps {
  gameState: GameStateSnapshot;
  errorMessage: string | null;
  onToggleReady: () => void;
  onUpdateSettings: (partial: Partial<RoomSettings>) => void;
  onStartGame: () => void;
  onKickPlayer: (targetId: string) => void;
  onSendMessage: (text: string) => void;
  onLeaveRoom: () => void;
  onClearError: () => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  gameState,
  errorMessage,
  onToggleReady,
  onUpdateSettings,
  onStartGame,
  onKickPlayer,
  onSendMessage,
  onLeaveRoom,
  onClearError,
}) => {
  const [copied, setCopied] = useState(false);

  const selfPlayer = gameState.players.find((p) => p.id === gameState.selfId);
  const isHost = Boolean(selfPlayer?.isHost);
  const activePlayers = gameState.players.filter((p) => !p.isSpectator);
  const canStart = isHost && activePlayers.length >= 2;

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/?room=${gameState.roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-3 sm:px-6 py-3 max-w-[1320px] w-full mx-auto">
      {/* Top Logo & Leave row */}
      <div className="flex items-center justify-between mb-2">
        <SkribblLogo size="sm" />
        <button
          type="button"
          onClick={onLeaveRoom}
          className="h-8 px-3 rounded-[3px] bg-white/15 hover:bg-[#DC2626] text-xs font-bold text-white inline-flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Room</span>
        </button>
      </div>

      {/* White skribbl.io Game Bar */}
      <header className="bg-white text-[#111827] rounded-[3px] px-3 sm:px-4 h-12 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 shrink-0">
          <SkribblClock timeLeft={0} />
          <span className="text-sm sm:text-base font-extrabold text-[#111827]">
            Round 1 of {gameState.settings.rounds}
          </span>
        </div>

        <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-[#374151]">
          WAITING
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#4B5563] hidden sm:inline">Room</span>
          <span
            data-testid="lobby-room-code"
            className="font-mono text-sm font-bold tracking-wider bg-[#F3F4F6] text-[#111827] px-2 py-0.5 rounded-[2px]"
          >
            {gameState.roomId}
          </span>
        </div>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="mt-2 flex items-center justify-between gap-4 rounded-[3px] bg-[#DC2626] px-4 py-2 text-sm font-bold text-white"
        >
          <span>{errorMessage}</span>
          <button type="button" onClick={onClearError} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Exact skribbl.io 3-Column Lobby Layout */}
      <main className="mt-2.5 flex-1 grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-2.5 items-stretch">
        {/* Left: Players List */}
        <div className="order-2 lg:order-1">
          <PlayerListSidebar
            players={gameState.players}
            selfId={gameState.selfId}
            drawerId={null}
            testId="lobby-player-list"
            showReadyStatus
            onKickPlayer={onKickPlayer}
            onVotekickPlayer={() => {}}
          />
        </div>

        {/* Center: Dark Charcoal Settings Panel */}
        <section
          aria-label="Room settings"
          className="order-1 lg:order-2 bg-[#2D323A] text-white rounded-[3px] p-4 flex flex-col justify-between shadow-sm"
        >
          <div className="space-y-2.5">
            <div className="grid grid-cols-[150px_1fr] items-center gap-3">
              <label htmlFor="lobby-maxplayers" className="text-sm font-bold text-white/95">
                Players
              </label>
              <input
                id="lobby-maxplayers"
                type="number"
                min={2}
                max={20}
                disabled={!isHost}
                value={gameState.settings.maxPlayers}
                onChange={(e) => onUpdateSettings({ maxPlayers: Number(e.target.value) })}
                className="w-full h-8 px-2.5 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-bold tabular-nums"
              />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-3">
              <label htmlFor="lobby-category" className="text-sm font-bold text-white/95">
                Category
              </label>
              <select
                id="lobby-category"
                disabled={!isHost}
                value={gameState.settings.category}
                onChange={(e) => onUpdateSettings({ category: e.target.value as WordCategory })}
                className="w-full h-8 px-2 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-bold"
              >
                {WORD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-3">
              <label htmlFor="lobby-drawtime" className="text-sm font-bold text-white/95">
                Drawtime
              </label>
              <input
                id="lobby-drawtime"
                type="number"
                min={15}
                max={240}
                step={5}
                disabled={!isHost}
                value={gameState.settings.drawTime}
                onChange={(e) => onUpdateSettings({ drawTime: Number(e.target.value) })}
                className="w-full h-8 px-2.5 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-bold tabular-nums"
              />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-3">
              <label htmlFor="lobby-rounds" className="text-sm font-bold text-white/95">
                Rounds
              </label>
              <input
                id="lobby-rounds"
                type="number"
                min={2}
                max={10}
                disabled={!isHost}
                value={gameState.settings.rounds}
                onChange={(e) => onUpdateSettings({ rounds: Number(e.target.value) })}
                className="w-full h-8 px-2.5 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-bold tabular-nums"
              />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-3">
              <label htmlFor="lobby-wordmode" className="text-sm font-bold text-white/95">
                Game Mode
              </label>
              <select
                id="lobby-wordmode"
                disabled={!isHost}
                value={gameState.settings.wordMode}
                onChange={(e) => onUpdateSettings({ wordMode: e.target.value as WordMode })}
                className="w-full h-8 px-2 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-bold"
              >
                <option value="normal">Normal</option>
                <option value="hidden">Hidden</option>
                <option value="combination">Combination</option>
              </select>
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-3">
              <label htmlFor="lobby-wordcount" className="text-sm font-bold text-white/95">
                Word Count
              </label>
              <input
                id="lobby-wordcount"
                type="number"
                min={1}
                max={5}
                disabled={!isHost}
                value={gameState.settings.wordCount}
                onChange={(e) => onUpdateSettings({ wordCount: Number(e.target.value) })}
                className="w-full h-8 px-2.5 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-bold tabular-nums"
              />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-3">
              <label htmlFor="lobby-hints" className="text-sm font-bold text-white/95">
                Hints
              </label>
              <input
                id="lobby-hints"
                type="number"
                min={0}
                max={5}
                disabled={!isHost}
                value={gameState.settings.hints}
                onChange={(e) => onUpdateSettings({ hints: Number(e.target.value) })}
                className="w-full h-8 px-2.5 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-bold tabular-nums"
              />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-3">
              <label htmlFor="lobby-visibility" className="text-sm font-bold text-white/95">
                Visibility
              </label>
              <select
                id="lobby-visibility"
                disabled={!isHost}
                value={gameState.settings.isPrivate ? 'private' : 'public'}
                onChange={(e) => onUpdateSettings({ isPrivate: e.target.value === 'private' })}
                className="w-full h-8 px-2 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-bold"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="pt-1">
              <label htmlFor="lobby-custom-words" className="block text-sm font-bold text-white/95 mb-1">
                Custom words
              </label>
              <textarea
                id="lobby-custom-words"
                rows={4}
                disabled={!isHost}
                defaultValue={gameState.settings.customWords.join(', ')}
                onBlur={(e) => {
                  const list = e.target.value
                    .split(',')
                    .map((w) => w.trim().toLowerCase())
                    .filter((w) => w.length >= 2);
                  onUpdateSettings({ customWords: list });
                }}
                placeholder="Optional custom words separated by a , (comma)"
                className="w-full p-2.5 rounded-[2px] bg-white disabled:bg-[#E5E7EB] text-[#111827] text-sm font-semibold resize-none"
              />
            </div>
          </div>

          {/* Bottom Invite & Start Bar (matching skribbl.io white invite + blue Copy + green Start!) */}
          <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-stretch gap-2">
              <div className="flex-1 h-11 px-3 rounded-[3px] bg-white text-[#2563EB] font-extrabold text-sm flex items-center justify-center truncate">
                Invite code: <span className="font-mono ml-1.5">{gameState.roomId}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-4 h-11 rounded-[3px] bg-[#2C8DFC] hover:bg-[#1E7CEB] text-white font-extrabold text-sm inline-flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              {isHost ? (
                <button
                  type="button"
                  data-start="true"
                  disabled={!canStart}
                  onClick={onStartGame}
                  className="px-7 h-11 rounded-[3px] bg-[#53E237] hover:bg-[#46CE2C] disabled:bg-[#6B7280] disabled:opacity-60 text-white font-extrabold text-lg inline-flex items-center justify-center gap-1.5 shrink-0 shadow-[0_2px_0_#369E21]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Game</span>
                </button>
              ) : (
                !selfPlayer?.isSpectator && (
                  <button
                    type="button"
                    onClick={onToggleReady}
                    className={`px-6 h-11 rounded-[3px] text-white font-extrabold text-sm shrink-0 ${
                      selfPlayer?.isReady
                        ? 'bg-[#53E237] hover:bg-[#46CE2C]'
                        : 'bg-[#4B5563] hover:bg-[#374151]'
                    }`}
                  >
                    {selfPlayer?.isReady ? 'Ready!' : 'Mark Ready'}
                  </button>
                )
              )}
            </div>

            {isHost && activePlayers.length < 2 && (
              <p className="text-xs font-semibold text-[#FDE68A] text-center">
                Share the invite link or room code — at least 2 players are required to start.
              </p>
            )}
          </div>
        </section>

        {/* Right: Chat Panel in Lobby */}
        <div className="order-3">
          <ChatPanel
            messages={gameState.messages}
            phase={gameState.phase}
            isDrawer={false}
            hasGuessed={false}
            isSpectator={Boolean(selfPlayer?.isSpectator)}
            onSendMessage={onSendMessage}
          />
        </div>
      </main>
    </div>
  );
};
