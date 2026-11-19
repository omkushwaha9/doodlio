import type { Server, Socket } from 'socket.io';
import { generateRoomCode } from '../src/shared/gameLogic.ts';
import type { DrawStroke, PublicRoomSummary, RoomSettings } from '../src/shared/types.ts';
import { RoomEntity } from './Room.ts';

export class MessageHandler {
  private readonly rooms: Map<string, RoomEntity> = new Map();
  private readonly socketToRoom: Map<string, string> = new Map();
  private readonly io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public getPublicRooms(): PublicRoomSummary[] {
    const list: PublicRoomSummary[] = [];
    for (const room of this.rooms.values()) {
      const summary = room.toPublicSummary();
      if (summary) list.push(summary);
    }
    return list;
  }

  private broadcastPublicRooms(): void {
    this.io.emit('public_rooms', this.getPublicRooms());
  }

  public registerSocket(socket: Socket): void {
    socket.on('get_public_rooms', () => {
      socket.emit('public_rooms', this.getPublicRooms());
    });

    socket.on(
      'create_room',
      (
        payload: { hostName?: string; settings?: Partial<RoomSettings>; isSpectator?: boolean },
        ack?: (res: { ok: boolean; roomId?: string; error?: string }) => void
      ) => {
        const hostName = String(payload?.hostName ?? '').trim();
        if (!hostName) {
          const err = 'Please enter a nickname.';
          socket.emit('room_error', { message: err });
          ack?.({ ok: false, error: err });
          return;
        }

        this.leaveCurrentRoom(socket);

        let roomId = generateRoomCode();
        while (this.rooms.has(roomId)) {
          roomId = generateRoomCode();
        }

        const room = new RoomEntity(roomId, payload?.settings, this.io);
        this.rooms.set(roomId, room);
        socket.join(roomId);
        this.socketToRoom.set(socket.id, roomId);

        const joinRes = room.addPlayer(socket.id, hostName, Boolean(payload?.isSpectator));
        if (!joinRes.ok) {
          this.rooms.delete(roomId);
          this.socketToRoom.delete(socket.id);
          socket.leave(roomId);
          socket.emit('room_error', { message: joinRes.error ?? 'Failed to create room.' });
          ack?.({ ok: false, error: joinRes.error });
          return;
        }

        this.broadcastPublicRooms();
        ack?.({ ok: true, roomId });
      }
    );

    socket.on(
      'join_room',
      (
        payload: { roomId?: string; playerName?: string; isSpectator?: boolean },
        ack?: (res: { ok: boolean; roomId?: string; error?: string }) => void
      ) => {
        const roomId = String(payload?.roomId ?? '').trim().toUpperCase();
        const playerName = String(payload?.playerName ?? '').trim();

        if (!roomId || !playerName) {
          const err = !playerName ? 'Please enter a nickname.' : 'Please enter a room code.';
          socket.emit('room_error', { message: err });
          ack?.({ ok: false, error: err });
          return;
        }

        const room = this.rooms.get(roomId);
        if (!room) {
          const err = `Room "${roomId}" was not found.`;
          socket.emit('room_error', { message: err });
          ack?.({ ok: false, error: err });
          return;
        }

        this.leaveCurrentRoom(socket);
        socket.join(roomId);
        this.socketToRoom.set(socket.id, roomId);

        const joinRes = room.addPlayer(socket.id, playerName, Boolean(payload?.isSpectator));
        if (!joinRes.ok) {
          this.socketToRoom.delete(socket.id);
          socket.leave(roomId);
          socket.emit('room_error', { message: joinRes.error ?? 'Unable to join room.' });
          ack?.({ ok: false, error: joinRes.error });
          return;
        }

        this.broadcastPublicRooms();
        ack?.({ ok: true, roomId });
      }
    );

    socket.on('leave_room', () => {
      this.leaveCurrentRoom(socket);
    });

    socket.on('toggle_ready', () => {
      const room = this.getRoomForSocket(socket.id);
      room?.toggleReady(socket.id);
    });

    socket.on('update_settings', (payload: { settings?: Partial<RoomSettings> }) => {
      const room = this.getRoomForSocket(socket.id);
      if (room && payload?.settings) {
        room.updateSettings(socket.id, payload.settings);
        this.broadcastPublicRooms();
      }
    });

    socket.on('start_game', () => {
      const room = this.getRoomForSocket(socket.id);
      if (!room) return;
      const res = room.startGame(socket.id);
      if (!res.ok && res.error) {
        socket.emit('room_error', { message: res.error });
      } else {
        this.broadcastPublicRooms();
      }
    });

    socket.on('play_again', () => {
      const room = this.getRoomForSocket(socket.id);
      room?.playAgain(socket.id);
      this.broadcastPublicRooms();
    });

    socket.on('word_chosen', (payload: { word?: string }) => {
      const room = this.getRoomForSocket(socket.id);
      if (!room || !payload?.word) return;
      room.game.chooseWord(
        socket.id,
        payload.word,
        Array.from(room.players.values()),
        room.settings
      );
    });

    socket.on(
      'draw_start',
      (payload: { strokeId?: string; x: number; y: number; color: string; size: number; isEraser?: boolean }) => {
        const room = this.getRoomForSocket(socket.id);
        if (!room || typeof payload?.x !== 'number' || typeof payload?.y !== 'number') return;
        const stroke: DrawStroke = {
          id: payload.strokeId || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          color: String(payload.color || '#18181B'),
          size: Number(payload.size) || 6,
          isEraser: Boolean(payload.isEraser),
          points: [{ x: payload.x, y: payload.y }],
        };
        room.handleDrawStart(socket.id, stroke);
      }
    );

    socket.on('draw_move', (payload: { strokeId?: string; x: number; y: number }) => {
      const room = this.getRoomForSocket(socket.id);
      if (!room || !payload?.strokeId || typeof payload?.x !== 'number' || typeof payload?.y !== 'number') return;
      room.handleDrawMove(socket.id, payload.strokeId, payload.x, payload.y);
    });

    socket.on('draw_end', (payload: { strokeId?: string }) => {
      const room = this.getRoomForSocket(socket.id);
      if (!room || !payload?.strokeId) return;
      room.handleDrawEnd(socket.id, payload.strokeId);
    });

    socket.on('canvas_clear', () => {
      const room = this.getRoomForSocket(socket.id);
      room?.handleCanvasClear(socket.id);
    });

    socket.on('draw_undo', () => {
      const room = this.getRoomForSocket(socket.id);
      room?.handleDrawUndo(socket.id);
    });

    socket.on('guess', (payload: { text?: string }) => {
      const room = this.getRoomForSocket(socket.id);
      if (room && typeof payload?.text === 'string') {
        room.handleGuess(socket.id, payload.text);
      }
    });

    socket.on('chat', (payload: { text?: string }) => {
      const room = this.getRoomForSocket(socket.id);
      if (room && typeof payload?.text === 'string') {
        room.handleGuess(socket.id, payload.text);
      }
    });

    socket.on('kick_player', (payload: { targetId?: string; ban?: boolean }) => {
      const room = this.getRoomForSocket(socket.id);
      if (room && payload?.targetId) {
        const kicked = room.kickPlayer(socket.id, payload.targetId, Boolean(payload.ban));
        if (kicked) {
          this.socketToRoom.delete(payload.targetId);
          this.io.sockets.sockets.get(payload.targetId)?.leave(room.roomId);
          this.broadcastPublicRooms();
        }
      }
    });

    socket.on('votekick_player', (payload: { targetId?: string }) => {
      const room = this.getRoomForSocket(socket.id);
      if (room && payload?.targetId) {
        const res = room.votekickPlayer(socket.id, payload.targetId);
        if (res?.kicked) {
          this.socketToRoom.delete(payload.targetId);
          this.io.sockets.sockets.get(payload.targetId)?.leave(room.roomId);
          this.broadcastPublicRooms();
        }
      }
    });

    socket.on('disconnect', () => {
      this.leaveCurrentRoom(socket);
    });
  }

  private getRoomForSocket(socketId: string): RoomEntity | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  private leaveCurrentRoom(socket: Socket): void {
    const roomId = this.socketToRoom.get(socket.id);
    if (!roomId) return;

    this.socketToRoom.delete(socket.id);
    socket.leave(roomId);

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.removePlayer(socket.id);
    if (room.players.size === 0) {
      room.destroy();
      this.rooms.delete(roomId);
    }
    this.broadcastPublicRooms();
  }
}
