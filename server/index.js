'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');
const { GameRoom } = require('./gameRoom.js');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Lorie Is With Us - WS Server\n');
});

const wss = new WebSocketServer({ server });

// roomCode -> GameRoom
const rooms = new Map();
// socketId -> { roomCode, socketId }
const connections = new Map();

let nextSocketId = 1;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateSocketId() {
  return `s_${nextSocketId++}_${Date.now()}`;
}

wss.on('connection', (ws) => {
  const socketId = generateSocketId();
  connections.set(socketId, { roomCode: null });

  console.log(`[WS] New connection: ${socketId}`);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) {
      console.log(`[WS] Parse error from ${socketId}:`, e.message);
      return;
    }

    console.log(`[WS] MSG from ${socketId}: type=${msg.type}`);

    const conn = connections.get(socketId);
    if (!conn) { console.log(`[WS] No conn for ${socketId}`); return; }

    if (msg.type === 'CREATE_ROOM') {
      if (conn.roomCode) return; // already in a room
      const name = (msg.name || 'Player').substring(0, 20);
      let code;
      do { code = generateRoomCode(); } while (rooms.has(code));

      const room = new GameRoom(code);
      room.addClient(socketId, ws, name, true);
      rooms.set(code, room);
      conn.roomCode = code;
      console.log(`[WS] Room created: ${code} by ${name}`);
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      if (conn.roomCode) return;
      const name = (msg.name || 'Player').substring(0, 20);
      const code = (msg.code || '').toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        ws.send(JSON.stringify({ type:'ERROR', message:'Room not found' }));
        return;
      }
      if (room.phase !== 'lobby') {
        ws.send(JSON.stringify({ type:'ERROR', message:'Game already in progress' }));
        return;
      }
      if (room.clients.size >= 10) {
        ws.send(JSON.stringify({ type:'ERROR', message:'Room is full' }));
        return;
      }
      room.addClient(socketId, ws, name, false);
      conn.roomCode = code;
      console.log(`[WS] ${name} joined room ${code}`);
      return;
    }

    if (msg.type === 'START_GAME') {
      if (!conn.roomCode) return;
      const room = rooms.get(conn.roomCode);
      if (!room) return;
      const client = room.clients.get(socketId);
      if (!client || !client.isHost) {
        ws.send(JSON.stringify({ type:'ERROR', message:'Only the host can start the game' }));
        return;
      }
      if (room.clients.size < 1) {
        ws.send(JSON.stringify({ type:'ERROR', message:'Need at least 1 player' }));
        return;
      }
      room.startGame();
      console.log(`[WS] Game started in room ${conn.roomCode}`);
      return;
    }

    // Game messages
    if (conn.roomCode) {
      const room = rooms.get(conn.roomCode);
      if (room && room.phase === 'playing') {
        room.handleMessage(socketId, msg);
      }
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Disconnected: ${socketId}`);
    const conn = connections.get(socketId);
    if (conn && conn.roomCode) {
      const room = rooms.get(conn.roomCode);
      if (room) {
        room.removeClient(socketId);
        if (room.isEmpty()) {
          room.stopLoop();
          rooms.delete(conn.roomCode);
          console.log(`[WS] Room ${conn.roomCode} deleted (empty)`);
        }
      }
    }
    connections.delete(socketId);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error on ${socketId}:`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
