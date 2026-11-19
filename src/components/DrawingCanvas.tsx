import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Eraser, Paintbrush, Play, RotateCcw, Trash2, Trophy } from 'lucide-react';
import type { DrawStroke, GameStateSnapshot } from '../shared/types';
import { hashSeed, SkribblAvatar } from './SkribblAssets';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

// Classic 2-row skribbl.io vibrant color grid
const SKRIBBL_PALETTE_ROW1 = [
  '#FFFFFF',
  '#C1C1C1',
  '#EF130B',
  '#FF7100',
  '#FFE400',
  '#00CC00',
  '#00B2FF',
  '#231FD3',
  '#A300BA',
  '#D37CAA',
  '#A0522D',
];

const SKRIBBL_PALETTE_ROW2 = [
  '#000000',
  '#4C4C4C',
  '#740B07',
  '#C23800',
  '#E8A200',
  '#005510',
  '#00569E',
  '#0E0865',
  '#550069',
  '#A75574',
  '#63300D',
];

const BRUSH_SIZES = [
  { label: 'Fine', size: 4, dotPx: 6 },
  { label: 'Medium', size: 9, dotPx: 11 },
  { label: 'Bold', size: 17, dotPx: 17 },
  { label: 'Heavy', size: 28, dotPx: 23 },
];

export interface DrawingCanvasHandle {
  applyRemoteDrawEvent: (payload: {
    action: 'start' | 'move' | 'end';
    stroke?: DrawStroke;
    strokeId?: string;
    x?: number;
    y?: number;
  }) => void;
  clearLocal: () => void;
  replaceStrokes: (strokes: DrawStroke[]) => void;
}

interface DrawingCanvasProps {
  gameState: GameStateSnapshot;
  isDrawer: boolean;
  isHost: boolean;
  onChooseWord: (word: string) => void;
  onDrawStart: (stroke: DrawStroke) => void;
  onDrawMove: (strokeId: string, x: number, y: number) => void;
  onDrawEnd: (strokeId: string) => void;
  onUndo: () => void;
  onClear: () => void;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

function paintStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke): void {
  const pts = stroke.points;
  if (pts.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
  ctx.fillStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
  ctx.lineWidth = stroke.size;

  if (pts.length === 1) {
    const x = pts[0].x * CANVAS_WIDTH;
    const y = pts[0].y * CANVAS_HEIGHT;
    ctx.beginPath();
    ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x * CANVAS_WIDTH, pts[0].y * CANVAS_HEIGHT);
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = ((pts[i].x + pts[i + 1].x) / 2) * CANVAS_WIDTH;
    const midY = ((pts[i].y + pts[i + 1].y) / 2) * CANVAS_HEIGHT;
    ctx.quadraticCurveTo(
      pts[i].x * CANVAS_WIDTH,
      pts[i].y * CANVAS_HEIGHT,
      midX,
      midY
    );
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x * CANVAS_WIDTH, last.y * CANVAS_HEIGHT);
  ctx.stroke();
  ctx.restore();
}

export const DrawingCanvas = React.forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  (
    {
      gameState,
      isDrawer,
      isHost,
      onChooseWord,
      onDrawStart,
      onDrawMove,
      onDrawEnd,
      onUndo,
      onClear,
      onPlayAgain,
      onLeaveRoom,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const strokesRef = useRef<DrawStroke[]>([]);
    const activeStrokeIdRef = useRef<string | null>(null);
    const isPointerDownRef = useRef(false);
    const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [activeColor, setActiveColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(9);
    const [isEraser, setIsEraser] = useState(false);
    const [isReplaying, setIsReplaying] = useState(false);

    const canDraw = isDrawer && gameState.phase === 'drawing';

    const redrawAll = useCallback((strokeList: DrawStroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (const stroke of strokeList) {
        paintStroke(ctx, stroke);
      }
    }, []);

    useEffect(() => {
      if (isReplaying) return;
      strokesRef.current = gameState.strokes.map((s) => ({
        ...s,
        points: [...s.points],
      }));
      redrawAll(strokesRef.current);
    }, [gameState.strokes, gameState.phase, gameState.round, redrawAll, isReplaying]);

    useEffect(() => {
      if (gameState.phase !== 'round_end' && replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
        replayTimerRef.current = null;
        setIsReplaying(false);
      }
      return () => {
        if (replayTimerRef.current) {
          clearInterval(replayTimerRef.current);
          replayTimerRef.current = null;
        }
      };
    }, [gameState.phase]);

    useEffect(() => {
      if (!canDraw) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          onUndo();
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [canDraw, onUndo]);

    useImperativeHandle(ref, () => ({
      applyRemoteDrawEvent(payload) {
        if (payload.action === 'start' && payload.stroke) {
          if (!strokesRef.current.some((s) => s.id === payload.stroke!.id)) {
            strokesRef.current.push({
              ...payload.stroke,
              points: [...payload.stroke.points],
            });
            redrawAll(strokesRef.current);
          }
        } else if (
          payload.action === 'move' &&
          payload.strokeId &&
          typeof payload.x === 'number' &&
          typeof payload.y === 'number'
        ) {
          const target = strokesRef.current.find((s) => s.id === payload.strokeId);
          if (target) {
            target.points.push({ x: payload.x, y: payload.y });
            redrawAll(strokesRef.current);
          }
        }
      },
      clearLocal() {
        strokesRef.current = [];
        redrawAll([]);
      },
      replaceStrokes(strokes) {
        strokesRef.current = strokes.map((s) => ({ ...s, points: [...s.points] }));
        redrawAll(strokesRef.current);
      },
    }), [redrawAll]);

    const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      return { x, y };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canDraw) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      const pt = getNormalizedPoint(e);
      const strokeId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const stroke: DrawStroke = {
        id: strokeId,
        color: activeColor,
        size: brushSize,
        isEraser,
        points: [pt],
      };

      isPointerDownRef.current = true;
      activeStrokeIdRef.current = strokeId;
      strokesRef.current.push(stroke);
      redrawAll(strokesRef.current);
      onDrawStart(stroke);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canDraw || !isPointerDownRef.current || !activeStrokeIdRef.current) return;
      const pt = getNormalizedPoint(e);
      const current = strokesRef.current.find((s) => s.id === activeStrokeIdRef.current);
      if (!current) return;

      const last = current.points[current.points.length - 1];
      const dx = pt.x - last.x;
      const dy = pt.y - last.y;
      if (dx * dx + dy * dy < 0.000004) return;

      current.points.push(pt);
      redrawAll(strokesRef.current);
      onDrawMove(activeStrokeIdRef.current, pt.x, pt.y);
    };

    const finishStroke = () => {
      if (!isPointerDownRef.current || !activeStrokeIdRef.current) return;
      const finishedId = activeStrokeIdRef.current;
      isPointerDownRef.current = false;
      activeStrokeIdRef.current = null;
      onDrawEnd(finishedId);
    };

    const handleStartReplay = () => {
      const source = gameState.lastRoundStrokes;
      if (!source.length || isReplaying) return;
      setIsReplaying(true);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      let strokeIdx = 0;
      let pointIdx = 0;
      const partial: DrawStroke[] = [];

      replayTimerRef.current = setInterval(() => {
        if (strokeIdx >= source.length) {
          if (replayTimerRef.current) clearInterval(replayTimerRef.current);
          replayTimerRef.current = null;
          setIsReplaying(false);
          return;
        }
        const currentSrc = source[strokeIdx];
        if (pointIdx === 0) {
          partial.push({ ...currentSrc, points: [] });
        }
        const chunk = Math.min(3, currentSrc.points.length - pointIdx);
        for (let k = 0; k < chunk; k++) {
          partial[partial.length - 1].points.push(currentSrc.points[pointIdx + k]);
        }
        pointIdx += chunk;
        redrawAll(partial);

        if (pointIdx >= currentSrc.points.length) {
          strokeIdx += 1;
          pointIdx = 0;
        }
      }, 24);
    };

    const drawerName =
      gameState.players.find((p) => p.id === gameState.drawerId)?.name ?? 'Player';

    return (
      <div className="flex flex-col gap-2 min-w-0">
        {/* White skribbl.io Drawing Canvas */}
        <div className="relative bg-white rounded-[3px] overflow-hidden shadow-sm">
          <canvas
            ref={canvasRef}
            data-testid="drawing-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            className={`w-full aspect-[3/2] block touch-none bg-white ${
              canDraw ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />

          {/* Dark Skribbl Overlay: Word Selection */}
          {gameState.phase === 'choosing' && (
            <div className="absolute inset-0 bg-[#0F172A]/82 flex items-center justify-center p-6 text-white">
              {isDrawer ? (
                <div className="max-w-lg w-full text-center">
                  <h2 className="text-2xl sm:text-3xl font-extrabold">
                    Choose a word ({gameState.timeLeft}s)
                  </h2>
                  <div
                    data-testid="word-choices"
                    className="mt-5 flex flex-wrap items-center justify-center gap-3"
                  >
                    {gameState.wordOptions.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => onChooseWord(word)}
                        className="px-5 py-2.5 rounded-[4px] border-2 border-white bg-white/10 hover:bg-[#53E237] hover:border-[#53E237] text-base font-extrabold text-white transition-colors"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-extrabold">
                    {drawerName} is choosing a word!
                  </p>
                  <p className="text-sm font-bold text-white/75 mt-1 tabular-nums">
                    {gameState.timeLeft}s
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Dark Skribbl Overlay: Round End */}
          {gameState.phase === 'round_end' && !isReplaying && (
            <div className="absolute inset-0 bg-[#0F172A]/84 flex items-center justify-center p-6 text-white">
              <div className="max-w-md w-full text-center">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#93C5FD]">
                  {gameState.roundEndReason === 'all_guessed'
                    ? 'Everyone guessed it!'
                    : gameState.roundEndReason === 'drawer_left'
                    ? 'Drawer disconnected'
                    : "Time's up!"}
                </p>
                <p className="text-sm font-bold text-white/80 mt-2">The word was</p>
                <h2 className="text-3xl font-extrabold text-[#53E237] mt-0.5">
                  {gameState.secretWord}
                </h2>

                <div className="mt-4 space-y-1.5 text-left max-h-44 overflow-y-auto bg-black/30 rounded p-3">
                  {gameState.players
                    .filter((p) => !p.isSpectator)
                    .sort((a, b) => b.roundScore - a.roundScore)
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm font-bold">
                        <span className="truncate">{p.name}</span>
                        <span
                          className={`tabular-nums ${
                            p.roundScore > 0 ? 'text-[#53E237]' : 'text-white/50'
                          }`}
                        >
                          +{p.roundScore}
                        </span>
                      </div>
                    ))}
                </div>

                {gameState.lastRoundStrokes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStartReplay}
                    className="mt-4 px-4 py-2 rounded-[3px] bg-[#2C8DFC] hover:bg-[#1E7CEB] text-xs font-extrabold text-white inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Replay Drawing</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dark Skribbl Overlay: Game Over */}
          {gameState.phase === 'game_over' && (
            <div className="absolute inset-0 bg-[#0F172A]/90 flex items-center justify-center p-6 text-white">
              <div data-testid="game-over-modal" className="max-w-md w-full text-center">
                {gameState.winner && (
                  <div className="flex flex-col items-center mb-3">
                    <SkribblAvatar
                      color={gameState.winner.avatarColor}
                      seed={hashSeed(gameState.winner.name)}
                      crown
                      sizePx={64}
                    />
                    <p className="text-2xl font-extrabold text-[#FFCC00] mt-2 inline-flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      <span>{gameState.winner.name} wins!</span>
                    </p>
                  </div>
                )}

                <ol className="mt-3 space-y-1.5 text-left max-h-48 overflow-y-auto bg-black/35 rounded p-3">
                  {gameState.leaderboard.map((entry) => (
                    <li key={entry.playerId} className="flex items-center justify-between text-sm font-bold">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-[#FFCC00] tabular-nums w-6">#{entry.rank}</span>
                        <span className="truncate">{entry.name}</span>
                      </div>
                      <span className="tabular-nums text-[#53E237]">{entry.score} pts</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 flex items-center justify-center gap-3">
                  {isHost && (
                    <button
                      type="button"
                      onClick={onPlayAgain}
                      className="px-5 py-2.5 rounded-[4px] bg-[#53E237] hover:bg-[#46CE2C] text-white text-sm font-extrabold shadow-[0_2px_0_#369E21]"
                    >
                      Play Again
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onLeaveRoom}
                    className="px-5 py-2.5 rounded-[4px] bg-[#2C8DFC] hover:bg-[#1E7CEB] text-white text-sm font-extrabold"
                  >
                    Leave Room
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Classic skribbl.io Drawing Toolbar */}
        {canDraw && (
          <div
            data-testid="drawing-toolbar"
            className="flex flex-wrap items-center justify-between gap-2 bg-transparent pt-0.5"
          >
            {/* Active Color Preview + 2-Row Swatch Grid */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-[3px] shadow-sm">
              <div
                className="w-11 h-11 rounded-[2px] border border-[#D1D5DB] shrink-0"
                style={{ backgroundColor: isEraser ? '#FFFFFF' : activeColor }}
                title="Current color"
              />
              <div className="flex flex-col gap-[2px]" role="group" aria-label="Ink colors">
                <div className="flex gap-[2px]">
                  {SKRIBBL_PALETTE_ROW1.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Color ${color}`}
                      aria-pressed={!isEraser && activeColor === color}
                      onClick={() => {
                        setIsEraser(false);
                        setActiveColor(color);
                      }}
                      className={`w-[22px] h-[22px] rounded-[2px] border ${
                        !isEraser && activeColor === color
                          ? 'ring-2 ring-[#2563EB] border-black z-10'
                          : 'border-[#D1D5DB]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-[2px]">
                  {SKRIBBL_PALETTE_ROW2.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Color ${color}`}
                      aria-pressed={!isEraser && activeColor === color}
                      onClick={() => {
                        setIsEraser(false);
                        setActiveColor(color);
                      }}
                      className={`w-[22px] h-[22px] rounded-[2px] border ${
                        !isEraser && activeColor === color
                          ? 'ring-2 ring-[#2563EB] border-black z-10'
                          : 'border-[#D1D5DB]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Brush Sizes */}
            <div
              className="flex items-center gap-1 bg-white p-1 rounded-[3px] shadow-sm"
              role="group"
              aria-label="Brush sizes"
            >
              {BRUSH_SIZES.map((b) => (
                <button
                  key={b.size}
                  type="button"
                  aria-label={`${b.label} brush size`}
                  aria-pressed={brushSize === b.size}
                  onClick={() => setBrushSize(b.size)}
                  className={`w-10 h-10 rounded-[2px] inline-flex items-center justify-center transition-colors ${
                    brushSize === b.size ? 'bg-[#BFDBFE] ring-2 ring-[#2563EB]' : 'hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span
                    className="rounded-full bg-[#111827] block"
                    style={{ width: b.dotPx, height: b.dotPx }}
                  />
                </button>
              ))}
            </div>

            {/* Brush, Eraser, Undo, Clear */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-[3px] shadow-sm">
              <button
                type="button"
                aria-label="Brush tool"
                aria-pressed={!isEraser}
                onClick={() => setIsEraser(false)}
                className={`w-10 h-10 rounded-[2px] inline-flex items-center justify-center transition-colors ${
                  !isEraser ? 'bg-[#BFDBFE] text-[#1D4ED8]' : 'text-[#374151] hover:bg-[#F3F4F6]'
                }`}
                title="Brush"
              >
                <Paintbrush className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Eraser tool"
                aria-pressed={isEraser}
                onClick={() => setIsEraser(true)}
                className={`w-10 h-10 rounded-[2px] inline-flex items-center justify-center transition-colors ${
                  isEraser ? 'bg-[#BFDBFE] text-[#1D4ED8]' : 'text-[#374151] hover:bg-[#F3F4F6]'
                }`}
                title="Eraser"
              >
                <Eraser className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onUndo}
                aria-label="Undo last stroke"
                className="w-10 h-10 rounded-[2px] text-[#374151] hover:bg-[#F3F4F6] inline-flex items-center justify-center transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear canvas"
                className="w-10 h-10 rounded-[2px] text-[#DC2626] hover:bg-[#FEE2E2] inline-flex items-center justify-center transition-colors"
                title="Clear canvas"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
