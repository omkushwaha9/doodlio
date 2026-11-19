import { useCallback, useEffect, useRef, useState } from 'react';
import { GameArena } from './components/GameArena';
import { LobbyEntry } from './components/LobbyEntry';
import { RoomLobby } from './components/RoomLobby';
import type { DrawingCanvasHandle } from './components/DrawingCanvas';
import { DEFAULT_ROOM_SETTINGS } from './shared/gameLogic';
import type {
  ChatMessage,
  DrawStroke,
  GameStateSnapshot,
  PublicRoomSummary,
  RoomSettings,
} from './shared/types';
import { getSocket } from './utils/socket';
import { soundEngine } from './utils/sound';

export default function App() {
  const [gameState, setGameState] = useState<GameStateSnapshot | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const autostartDoneRef = useRef(false);

  const searchParams = new URLSearchParams(window.location.search);
  const initialRoomCode = (searchParams.get('room') ?? '').trim().toUpperCase();
  const shouldAutostart = searchParams.get('autostart') === '1';

  // Mirror current phase to document.body.dataset.state
  useEffect(() => {
    if (!gameState) {
      document.body.dataset.state = 'title';
    } else if (gameState.phase === 'lobby') {
      document.body.dataset.state = 'lobby';
    } else if (gameState.phase === 'game_over') {
      document.body.dataset.state = 'gameover';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [gameState]);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      socket.emit('get_public_rooms');
      if (shouldAutostart && !autostartDoneRef.current) {
        autostartDoneRef.current = true;
        socket.emit('create_room', {
          hostName: 'Player 1',
          settings: DEFAULT_ROOM_SETTINGS,
        });
      }
    };

    const handlePublicRooms = (rooms: PublicRoomSummary[]) => {
      setPublicRooms(rooms);
    };

    const handleGameState = (snapshot: GameStateSnapshot) => {
      setIsSubmitting(false);
      setErrorMessage(null);
      setGameState((prev) => {
        if (prev && prev.phase !== snapshot.phase) {
          if (snapshot.phase === 'drawing') soundEngine.playRoundStart();
          if (snapshot.phase === 'round_end') soundEngine.playRoundEnd();
          if (snapshot.phase === 'game_over') soundEngine.playGameOver();
        }
        return snapshot;
      });
    };

    const handleTimerTick = (payload: { timeLeft: number; wordMask: string }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        if (prev.phase === 'drawing' && payload.timeLeft > 0 && payload.timeLeft <= 5) {
          soundEngine.playTick();
        }
        return {
          ...prev,
          timeLeft: payload.timeLeft,
          wordMask: payload.wordMask,
        };
      });
    };

    const handleDrawData = (payload: {
      action: 'start' | 'move' | 'end';
      stroke?: DrawStroke;
      strokeId?: string;
      x?: number;
      y?: number;
    }) => {
      canvasRef.current?.applyRemoteDrawEvent(payload);
    };

    const handleCanvasClear = () => {
      canvasRef.current?.clearLocal();
      setGameState((prev) => (prev ? { ...prev, strokes: [] } : prev));
    };

    const handleDrawUndo = (payload: { strokes: DrawStroke[] }) => {
      canvasRef.current?.replaceStrokes(payload.strokes);
      setGameState((prev) => (prev ? { ...prev, strokes: payload.strokes } : prev));
    };

    const handleChatMessage = (msg: ChatMessage) => {
      if (msg.type === 'guess_correct') {
        soundEngine.playCorrectGuess();
      }
      setGameState((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === msg.id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, msg].slice(-100),
        };
      });
    };

    const handleRoomError = (payload: { message: string }) => {
      setIsSubmitting(false);
      setErrorMessage(payload.message);
    };

    const handleKicked = (payload: { reason: string }) => {
      setGameState(null);
      setErrorMessage(payload.reason || 'You were removed from the room.');
    };

    socket.on('connect', handleConnect);
    socket.on('public_rooms', handlePublicRooms);
    socket.on('game_state', handleGameState);
    socket.on('timer_tick', handleTimerTick);
    socket.on('draw_data', handleDrawData);
    socket.on('canvas_clear', handleCanvasClear);
    socket.on('draw_undo', handleDrawUndo);
    socket.on('chat_message', handleChatMessage);
    socket.on('room_error', handleRoomError);
    socket.on('kicked', handleKicked);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('public_rooms', handlePublicRooms);
      socket.off('game_state', handleGameState);
      socket.off('timer_tick', handleTimerTick);
      socket.off('draw_data', handleDrawData);
      socket.off('canvas_clear', handleCanvasClear);
      socket.off('draw_undo', handleDrawUndo);
      socket.off('chat_message', handleChatMessage);
      socket.off('room_error', handleRoomError);
      socket.off('kicked', handleKicked);
    };
  }, [shouldAutostart]);

  const handleCreateRoom = useCallback(
    (hostName: string, settings: RoomSettings, isSpectator: boolean) => {
      if (!hostName.trim()) {
        setErrorMessage('Please enter a nickname.');
        return;
      }
      setErrorMessage(null);
      setIsSubmitting(true);
      getSocket().emit('create_room', { hostName, settings, isSpectator }, (res: { ok: boolean; error?: string }) => {
        if (!res?.ok) {
          setIsSubmitting(false);
          if (res?.error) setErrorMessage(res.error);
        }
      });
    },
    []
  );

  const handleJoinRoom = useCallback((roomId: string, playerName: string, isSpectator: boolean) => {
    if (!playerName.trim()) {
      setErrorMessage('Please enter a nickname.');
      return;
    }
    if (!roomId.trim()) {
      setErrorMessage('Please enter a room code.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    getSocket().emit(
      'join_room',
      { roomId: roomId.trim().toUpperCase(), playerName, isSpectator },
      (res: { ok: boolean; error?: string }) => {
        if (!res?.ok) {
          setIsSubmitting(false);
          if (res?.error) setErrorMessage(res.error);
        }
      }
    );
  }, []);

  const handleRefreshRooms = useCallback(() => {
    getSocket().emit('get_public_rooms');
  }, []);

  const handleLeaveRoom = useCallback(() => {
    getSocket().emit('leave_room');
    setGameState(null);
    setErrorMessage(null);
    window.history.replaceState({}, '', '/');
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.muted = next;
      return next;
    });
  }, []);

  if (!gameState) {
    return (
      <LobbyEntry
        initialRoomCode={initialRoomCode}
        publicRooms={publicRooms}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onRefreshRooms={handleRefreshRooms}
        onClearError={() => setErrorMessage(null)}
      />
    );
  }

  if (gameState.phase === 'lobby') {
    return (
      <RoomLobby
        gameState={gameState}
        errorMessage={errorMessage}
        onToggleReady={() => getSocket().emit('toggle_ready')}
        onUpdateSettings={(partial) => getSocket().emit('update_settings', { settings: partial })}
        onStartGame={() => getSocket().emit('start_game')}
        onKickPlayer={(targetId) => getSocket().emit('kick_player', { targetId })}
        onSendMessage={(text) => getSocket().emit('chat', { text })}
        onLeaveRoom={handleLeaveRoom}
        onClearError={() => setErrorMessage(null)}
      />
    );
  }

  return (
    <GameArena
      gameState={gameState}
      canvasRef={canvasRef}
      isMuted={isMuted}
      onToggleMute={handleToggleMute}
      onChooseWord={(word) => getSocket().emit('word_chosen', { word })}
      onDrawStart={(stroke) =>
        getSocket().emit('draw_start', {
          strokeId: stroke.id,
          x: stroke.points[0]?.x ?? 0,
          y: stroke.points[0]?.y ?? 0,
          color: stroke.color,
          size: stroke.size,
          isEraser: stroke.isEraser,
        })
      }
      onDrawMove={(strokeId, x, y) => getSocket().emit('draw_move', { strokeId, x, y })}
      onDrawEnd={(strokeId) => getSocket().emit('draw_end', { strokeId })}
      onUndo={() => getSocket().emit('draw_undo')}
      onClear={() => getSocket().emit('canvas_clear')}
      onSendMessage={(text) => getSocket().emit('guess', { text })}
      onKickPlayer={(targetId) => getSocket().emit('kick_player', { targetId })}
      onVotekickPlayer={(targetId) => getSocket().emit('votekick_player', { targetId })}
      onPlayAgain={() => getSocket().emit('play_again')}
      onLeaveRoom={handleLeaveRoom}
    />
  );
}
