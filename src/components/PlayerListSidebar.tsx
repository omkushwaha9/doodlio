import React from 'react';
import { Check, Flag, Pencil, UserX } from 'lucide-react';
import type { PlayerPublic } from '../shared/types';
import { hashSeed, SkribblAvatar } from './SkribblAssets';

interface PlayerListSidebarProps {
  players: PlayerPublic[];
  selfId: string;
  drawerId: string | null;
  testId?: string;
  showReadyStatus?: boolean;
  onKickPlayer: (targetId: string) => void;
  onVotekickPlayer: (targetId: string) => void;
}

export const PlayerListSidebar: React.FC<PlayerListSidebarProps> = ({
  players,
  selfId,
  drawerId,
  testId = 'arena-player-list',
  showReadyStatus = false,
  onKickPlayer,
  onVotekickPlayer,
}) => {
  const selfPlayer = players.find((p) => p.id === selfId);
  const isSelfHost = Boolean(selfPlayer?.isHost);

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isSpectator !== b.isSpectator) return a.isSpectator ? 1 : -1;
    return b.score - a.score || a.name.localeCompare(b.name);
  });

  let rankCounter = 0;

  return (
    <aside
      aria-label="Players and scores"
      className="bg-transparent rounded-[3px] flex flex-col min-h-0 lg:h-full"
    >
      <ul data-testid={testId} className="space-y-[2px] overflow-y-auto flex-1">
        {sortedPlayers.map((player, idx) => {
          const isSelf = player.id === selfId;
          const isDrawing = player.id === drawerId;
          if (!player.isSpectator) rankCounter += 1;

          const rowBg = player.hasGuessed
            ? 'bg-[#7CE66A] text-[#052E16]'
            : idx % 2 === 0
            ? 'bg-white text-[#111827]'
            : 'bg-[#EEEEEE] text-[#111827]';

          return (
            <li
              key={player.id}
              className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[2px] ${rowBg}`}
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold tabular-nums">
                    {player.isSpectator ? '—' : `#${rankCounter}`}
                  </span>
                  {isDrawing && (
                    <span title="Currently drawing" aria-label="Drawing" className="text-[#111827]">
                      <Pencil className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {player.hasGuessed && !isDrawing && (
                    <span title="Guessed the word" aria-label="Guessed" className="text-[#15803D]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                {showReadyStatus && !player.isHost && !player.isSpectator && (
                  <span
                    className={`text-[10px] font-bold ${
                      player.isReady ? 'text-[#16A34A]' : 'text-[#6B7280]'
                    }`}
                  >
                    {player.isReady ? 'Ready' : 'Waiting'}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center">
                <div
                  className={`text-xs sm:text-[13px] font-extrabold truncate ${
                    isSelf ? 'text-[#2563EB]' : ''
                  }`}
                >
                  {player.name} {isSelf ? '(You)' : ''}
                </div>
                <div className="text-[11px] font-bold tabular-nums opacity-85">
                  {player.isSpectator ? (
                    'Spectating'
                  ) : (
                    <>
                      {player.score} points
                      {player.roundScore > 0 && (
                        <span className="ml-1 text-[#15803D]">+{player.roundScore}</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isSelf && !selfPlayer?.isSpectator && (
                  <div className="hidden group-hover:flex group-focus-within:flex items-center">
                    {isSelfHost ? (
                      <button
                        type="button"
                        onClick={() => onKickPlayer(player.id)}
                        aria-label={`Kick ${player.name}`}
                        title={`Kick ${player.name}`}
                        className="p-1 rounded text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onVotekickPlayer(player.id)}
                        aria-label={`Vote to kick ${player.name}`}
                        title={`Vote to kick ${player.name}`}
                        className="p-1 rounded text-[#6B7280] hover:text-[#D97706] hover:bg-[#FEF3C7]"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <SkribblAvatar
                  color={player.avatarColor}
                  seed={hashSeed(player.name)}
                  crown={player.isHost}
                  sizePx={36}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
