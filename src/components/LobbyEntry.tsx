import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Dices, RefreshCw } from 'lucide-react';
import { DEFAULT_ROOM_SETTINGS } from '../shared/gameLogic';
import { WORD_CATEGORIES } from '../shared/words';
import type { PublicRoomSummary, RoomSettings, WordCategory, WordMode } from '../shared/types';
import { AVATAR_COLORS, SkribblAvatar, SkribblLogo } from './SkribblAssets';

interface LobbyEntryProps {
  initialRoomCode: string;
  publicRooms: PublicRoomSummary[];
  errorMessage: string | null;
  isSubmitting: boolean;
  onCreateRoom: (hostName: string, settings: RoomSettings, isSpectator: boolean) => void;
  onJoinRoom: (roomId: string, playerName: string, isSpectator: boolean) => void;
  onRefreshRooms: () => void;
  onClearError: () => void;
}

const BANNER_AVATARS = [
  { color: '#FF3B30', seed: 9, crown: false },
  { color: '#FF9500', seed: 5, crown: false },
  { color: '#FFCC00', seed: 2, crown: true },
  { color: '#4CD964', seed: 1, crown: false },
  { color: '#32ADE6', seed: 14, crown: false },
  { color: '#2563EB', seed: 7, crown: false },
  { color: '#8B5CF6', seed: 0, crown: false },
  { color: '#EC4899', seed: 3, crown: false },
];

export const LobbyEntry: React.FC<LobbyEntryProps> = ({
  initialRoomCode,
  publicRooms,
  errorMessage,
  isSubmitting,
  onCreateRoom,
  onJoinRoom,
  onRefreshRooms,
  onClearError,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [isSpectator, setIsSpectator] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [avatarColorIdx, setAvatarColorIdx] = useState(6);
  const [avatarSeed, setAvatarSeed] = useState(9);

  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);
  const [customWordsRaw, setCustomWordsRaw] = useState('');

  const parseCustomWords = () =>
    customWordsRaw
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length >= 2);

  const handlePlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'join' || roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase(), nickname, isSpectator);
      return;
    }
    onCreateRoom(nickname, { ...settings, customWords: parseCustomWords() }, false);
  };

  const handleCreatePrivate = () => {
    onCreateRoom(
      nickname,
      { ...settings, isPrivate: true, customWords: parseCustomWords() },
      false
    );
  };

  const randomizeAvatar = () => {
    setAvatarColorIdx(Math.floor(Math.random() * AVATAR_COLORS.length));
    setAvatarSeed(Math.floor(Math.random() * 16));
  };

  return (
    <main className="min-h-screen flex flex-col justify-between text-white">
      {/* Top Hero Stage */}
      <div className="w-full max-w-5xl mx-auto px-4 pt-6 pb-10 flex flex-col items-center">
        <SkribblLogo size="lg" />

        {/* Row of 8 cute skribbl avatars */}
        <div className="mt-3 mb-5 flex items-center justify-center gap-1 sm:gap-2 flex-wrap" aria-hidden="true">
          {BANNER_AVATARS.map((av, idx) => (
            <SkribblAvatar key={idx} color={av.color} seed={av.seed} crown={av.crown} sizePx={40} />
          ))}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 w-full max-w-[440px] flex items-center justify-between gap-3 rounded bg-[#DC2626] px-4 py-2.5 text-sm font-bold text-white shadow-md"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={onClearError}
              className="text-xs underline underline-offset-2 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Center skribbl.io Translucent Navy Card */}
        <section
          aria-label="Room setup"
          className="w-full max-w-[440px] bg-[#0C2C96]/85 rounded-md p-4 shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
        >
          <form onSubmit={handlePlay} className="space-y-3">
            {/* Nickname + Category row (matching name + language row) */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="nickname-input" className="sr-only">
                  Nickname
                </label>
                <input
                  id="nickname-input"
                  type="text"
                  maxLength={20}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full h-9 px-3 rounded-[3px] bg-white text-[#111827] text-sm font-semibold placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
              <div className="w-32 shrink-0">
                <label htmlFor="category-select" className="sr-only">
                  Word Category
                </label>
                <select
                  id="category-select"
                  value={settings.category}
                  onChange={(e) => setSettings((s) => ({ ...s, category: e.target.value as WordCategory }))}
                  className="w-full h-9 px-2 rounded-[3px] bg-white text-[#111827] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                >
                  {WORD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Avatar Customizer Box */}
            <div className="relative bg-[#071E68]/80 rounded-[3px] py-3 px-4 flex items-center justify-center gap-4">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-label="Previous avatar color"
                  onClick={() =>
                    setAvatarColorIdx((i) => (i - 1 + AVATAR_COLORS.length) % AVATAR_COLORS.length)
                  }
                  className="p-0.5 text-white/80 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Previous avatar expression"
                  onClick={() => setAvatarSeed((s) => (s - 1 + 16) % 16)}
                  className="p-0.5 text-white/80 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <SkribblAvatar
                color={AVATAR_COLORS[avatarColorIdx]}
                seed={avatarSeed}
                sizePx={72}
              />

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-label="Next avatar color"
                  onClick={() => setAvatarColorIdx((i) => (i + 1) % AVATAR_COLORS.length)}
                  className="p-0.5 text-white/80 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next avatar expression"
                  onClick={() => setAvatarSeed((s) => (s + 1) % 16)}
                  className="p-0.5 text-white/80 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={randomizeAvatar}
                aria-label="Randomize avatar"
                title="Randomize avatar"
                className="absolute top-2 right-2 p-1 text-white/75 hover:text-white"
              >
                <Dices className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher: Create Room vs Join Room */}
            <div className="flex gap-1 bg-[#071E68]/90 p-1 rounded-[3px]" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'create'}
                onClick={() => setMode('create')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
                  mode === 'create'
                    ? 'bg-[#2C8DFC] text-white'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                Create Room
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'join'}
                onClick={() => setMode('join')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
                  mode === 'join'
                    ? 'bg-[#2C8DFC] text-white'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                Join Room
              </button>
            </div>

            {mode === 'join' ? (
              <div className="space-y-2.5">
                <div>
                  <label htmlFor="room-code-input" className="block text-xs font-bold text-white/85 mb-1">
                    Room Code
                  </label>
                  <input
                    id="room-code-input"
                    type="text"
                    maxLength={8}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. K7M9P2"
                    className="w-full h-9 px-3 rounded-[3px] bg-white font-mono uppercase tracking-wider text-sm font-bold text-[#111827] placeholder:text-[#6B7280] focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-white/90 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpectator}
                    onChange={(e) => setIsSpectator(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#53E237]"
                  />
                  <span>Join as spectator</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-[4px] bg-[#53E237] hover:bg-[#46CE2C] active:translate-y-[1px] disabled:opacity-60 text-white text-xl font-extrabold shadow-[0_3px_0_#369E21] transition-colors"
                >
                  Join Room
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Toggleable quick room settings inside card */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full text-left text-xs font-bold text-[#93C5FD] hover:text-white flex items-center justify-between py-0.5"
                >
                  <span>Room Settings ({settings.rounds} rounds · {settings.drawTime}s · {settings.isPrivate ? 'Private' : 'Public'})</span>
                  <span>{showAdvanced ? 'Hide ▲' : 'Customize ▼'}</span>
                </button>

                {showAdvanced && (
                  <div className="grid grid-cols-2 gap-2 bg-[#071E68]/80 p-2.5 rounded-[3px] text-xs">
                    <div>
                      <label htmlFor="visibility-select" className="block font-bold text-white/80 mb-1">
                        Visibility
                      </label>
                      <select
                        id="visibility-select"
                        value={settings.isPrivate ? 'private' : 'public'}
                        onChange={(e) => setSettings((s) => ({ ...s, isPrivate: e.target.value === 'private' }))}
                        className="w-full h-8 px-2 rounded-[2px] bg-white text-[#111827] font-semibold"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="max-players-input" className="block font-bold text-white/80 mb-1">
                        Max Players (2–20)
                      </label>
                      <input
                        id="max-players-input"
                        type="number"
                        min={2}
                        max={20}
                        value={settings.maxPlayers}
                        onChange={(e) => setSettings((s) => ({ ...s, maxPlayers: Number(e.target.value) }))}
                        className="w-full h-8 px-2 rounded-[2px] bg-white text-[#111827] font-semibold tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor="rounds-input" className="block font-bold text-white/80 mb-1">
                        Rounds (2–10)
                      </label>
                      <input
                        id="rounds-input"
                        type="number"
                        min={2}
                        max={10}
                        value={settings.rounds}
                        onChange={(e) => setSettings((s) => ({ ...s, rounds: Number(e.target.value) }))}
                        className="w-full h-8 px-2 rounded-[2px] bg-white text-[#111827] font-semibold tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor="draw-time-input" className="block font-bold text-white/80 mb-1">
                        Draw Time (15–240s)
                      </label>
                      <input
                        id="draw-time-input"
                        type="number"
                        min={15}
                        max={240}
                        step={5}
                        value={settings.drawTime}
                        onChange={(e) => setSettings((s) => ({ ...s, drawTime: Number(e.target.value) }))}
                        className="w-full h-8 px-2 rounded-[2px] bg-white text-[#111827] font-semibold tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor="word-count-input" className="block font-bold text-white/80 mb-1">
                        Word Choices (1–5)
                      </label>
                      <input
                        id="word-count-input"
                        type="number"
                        min={1}
                        max={5}
                        value={settings.wordCount}
                        onChange={(e) => setSettings((s) => ({ ...s, wordCount: Number(e.target.value) }))}
                        className="w-full h-8 px-2 rounded-[2px] bg-white text-[#111827] font-semibold tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor="hints-input" className="block font-bold text-white/80 mb-1">
                        Hints (0–5)
                      </label>
                      <input
                        id="hints-input"
                        type="number"
                        min={0}
                        max={5}
                        value={settings.hints}
                        onChange={(e) => setSettings((s) => ({ ...s, hints: Number(e.target.value) }))}
                        className="w-full h-8 px-2 rounded-[2px] bg-white text-[#111827] font-semibold tabular-nums"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="word-mode-select" className="block font-bold text-white/80 mb-1">
                        Word Mode
                      </label>
                      <select
                        id="word-mode-select"
                        value={settings.wordMode}
                        onChange={(e) => setSettings((s) => ({ ...s, wordMode: e.target.value as WordMode }))}
                        className="w-full h-8 px-2 rounded-[2px] bg-white text-[#111827] font-semibold"
                      >
                        <option value="normal">Normal</option>
                        <option value="hidden">Hidden</option>
                        <option value="combination">Combination</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="custom-words-input" className="block font-bold text-white/80 mb-1">
                        Custom Words (comma-separated)
                      </label>
                      <input
                        id="custom-words-input"
                        type="text"
                        value={customWordsRaw}
                        onChange={(e) => setCustomWordsRaw(e.target.value)}
                        placeholder="e.g. espresso, monorail, origami"
                        className="w-full h-8 px-2 rounded-[2px] bg-white text-[#111827] font-semibold"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  data-start="true"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-[4px] bg-[#53E237] hover:bg-[#46CE2C] active:translate-y-[1px] disabled:opacity-60 text-white text-xl font-extrabold shadow-[0_3px_0_#369E21] transition-colors"
                >
                  Create Room
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreatePrivate}
                  className="w-full h-9 rounded-[4px] bg-[#2C8DFC] hover:bg-[#1E7CEB] active:translate-y-[1px] disabled:opacity-60 text-white text-sm font-extrabold shadow-[0_3px_0_#1661BA] transition-colors"
                >
                  Create Private Room
                </button>
              </div>
            )}
          </form>
        </section>
      </div>

      {/* Lower Slanted skribbl.io 3-Column Info & Open Public Rooms Band */}
      <div className="w-full bg-[#0D3987]/90 border-t-4 border-[#0A2D6E] py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: About */}
          <section className="bg-[#0B2D6F]/85 rounded-md p-5 border border-white/10">
            <h2 className="text-lg font-extrabold text-white text-center mb-3">About</h2>
            <p className="text-sm text-white/90 leading-relaxed">
              <strong>Doodlio</strong> is a free multiplayer drawing and guessing pictionary game.
            </p>
            <p className="text-sm text-white/85 leading-relaxed mt-3">
              Each round, one player draws a chosen word while everyone else races to guess it in chat. Earn points for fast guesses and clear drawings!
            </p>
          </section>

          {/* Card 2: Open Public Rooms (Real live directory) */}
          <section
            aria-label="Open public rooms"
            className="bg-[#0B2D6F]/85 rounded-md p-5 border border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-white">Open Rooms</h2>
              <button
                type="button"
                onClick={onRefreshRooms}
                aria-label="Refresh public rooms"
                className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {publicRooms.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 border border-dashed border-white/20 rounded px-3">
                <p className="text-sm font-bold text-white">No public rooms open</p>
                <p className="text-xs text-white/75 mt-1">
                  Enter your name above and click Create Room to start one!
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10 space-y-1 max-h-56 overflow-y-auto">
                {publicRooms.map((room) => (
                  <li key={room.roomId} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-[#FFCC00]">{room.roomId}</span>
                        <span className="text-xs text-white/80 truncate">by {room.hostName}</span>
                      </div>
                      <div className="text-xs text-white/70 tabular-nums">
                        {room.playerCount}/{room.maxPlayers} · {room.rounds} rds · {room.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJoinRoom(room.roomId, nickname, isSpectator)}
                      disabled={room.playerCount >= room.maxPlayers}
                      className="px-3 py-1 rounded bg-[#53E237] hover:bg-[#46CE2C] disabled:opacity-40 text-xs font-extrabold text-white shrink-0"
                    >
                      {room.playerCount >= room.maxPlayers ? 'Full' : 'Join'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Card 3: How to play */}
          <section className="bg-[#0B2D6F]/85 rounded-md p-5 border border-white/10 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white text-center mb-3">How to play</h2>
              <ol className="text-sm text-white/90 space-y-2 list-decimal list-inside">
                <li>Create a room or join with an invite code.</li>
                <li>When it&apos;s your turn, pick a word and draw it.</li>
                <li>Type guesses in chat before the clock runs out.</li>
                <li>Score the most points across all rounds to win!</li>
              </ol>
            </div>
            {/* Sketch house illustration matching skribbl.io */}
            <svg viewBox="0 0 180 85" className="w-36 h-16 mx-auto mt-3 opacity-90" aria-hidden="true">
              <path
                d="M45 45 L85 18 L125 45 V78 H45 Z"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <rect x="76" y="54" width="16" height="24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
              <rect x="54" y="52" width="14" height="14" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
            </svg>
          </section>
        </div>
      </div>
    </main>
  );
};
