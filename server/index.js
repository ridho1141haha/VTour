import http from 'node:http';
import { WebSocketServer } from 'ws';
import {
  MAX_PEERS,
  clampMove,
  createRateLimiter,
  maskBlockedWords,
  sanitizeChat,
  sanitizeName,
} from './lib/util.js';

const PORT = Number(process.env.PORT) || 8787;
const GUIDE_PASSCODE = process.env.GUIDE_PASSCODE || '';
const CHAT_HISTORY_LIMIT = 20;
const MOVE_LIMIT = { limit: 25, windowMs: 1000 };
const CHAT_LIMIT = { limit: 3, windowMs: 5000 };
const TOTAL_LIMIT = { limit: 40, windowMs: 1000 };
const MAX_VIOLATIONS = 8;

const peers = new Map();
const chatHistory = [];
let guideId = null;
let nextPeerNumber = 1;

const httpServer = http.createServer((request, response) => {
  if (request.url === '/healthz') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', peers: peers.size }));
    return;
  }
  response.writeHead(404);
  response.end();
});

const wss = new WebSocketServer({ server: httpServer });

function broadcast(payload, excludeId = null) {
  const data = JSON.stringify(payload);
  for (const peer of peers.values()) {
    if (peer.id !== excludeId && peer.socket.readyState === peer.socket.OPEN) {
      peer.socket.send(data);
    }
  }
}

function sendTo(peer, payload) {
  if (peer.socket.readyState === peer.socket.OPEN) {
    peer.socket.send(JSON.stringify(payload));
  }
}

function publicPeer(peer) {
  return { id: peer.id, name: peer.name, x: peer.x, z: peer.z, yaw: peer.yaw };
}

function setGuide(peer) {
  guideId = peer ? peer.id : null;
  broadcast({ t: 'guide', guideId, guideName: peer ? peer.name : null });
}

function closePeer(peer) {
  if (!peers.has(peer.id)) return;
  peers.delete(peer.id);
  if (guideId === peer.id) setGuide(null);
  broadcast({ t: 'peer-leave', id: peer.id });
}

function handleJoin(peer, message) {
  const wasRename = peer.joined;
  peer.name = sanitizeName(message.name);
  peer.joined = true;

  if (wasRename) {
    broadcast({ t: 'peer-rename', id: peer.id, name: peer.name }, peer.id);
    sendTo(peer, { t: 'renamed', name: peer.name });
    return;
  }

  sendTo(peer, {
    t: 'welcome',
    id: peer.id,
    peers: [...peers.values()].filter((other) => other.id !== peer.id).map(publicPeer),
    chat: chatHistory,
    guideId,
    guideName: peers.get(guideId)?.name ?? null,
  });
  broadcast({ t: 'peer-join', peer: publicPeer(peer) }, peer.id);
}

function handleMove(peer, message) {
  const move = clampMove(message.x, message.z, message.yaw);
  if (!move) return;
  peer.x = move.x;
  peer.z = move.z;
  peer.yaw = move.yaw;
  broadcast({ t: 'peer-move', id: peer.id, x: move.x, z: move.z, yaw: move.yaw }, peer.id);
}

function handleChat(peer, message) {
  const text = sanitizeChat(message.text);
  if (!text) return;
  const entry = { t: 'chat', id: peer.id, name: peer.name, text: maskBlockedWords(text), at: Date.now() };
  chatHistory.push(entry);
  if (chatHistory.length > CHAT_HISTORY_LIMIT) chatHistory.shift();
  broadcast(entry);
}

function handleClaimGuide(peer, message) {
  if (guideId && guideId !== peer.id) {
    sendTo(peer, { t: 'guide-taken', guideName: peers.get(guideId)?.name ?? null });
    return;
  }
  if (GUIDE_PASSCODE && message.passcode !== GUIDE_PASSCODE) {
    sendTo(peer, { t: 'error', code: 'bad-passcode', message: 'Passcode pemandu salah.' });
    return;
  }
  setGuide(peer);
}

wss.on('connection', (socket) => {
  if (peers.size >= MAX_PEERS) {
    socket.send(JSON.stringify({ t: 'error', code: 'full', message: 'Server penuh, coba beberapa saat lagi.' }));
    socket.close(1013, 'server full');
    return;
  }

  const peer = {
    id: `p${nextPeerNumber.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: `Pengunjung-${String(nextPeerNumber).padStart(2, '0')}`,
    x: 0,
    z: 12,
    yaw: 0,
    socket,
    joined: false,
    alive: true,
    violations: 0,
    moveLimiter: createRateLimiter(MOVE_LIMIT),
    chatLimiter: createRateLimiter(CHAT_LIMIT),
    totalLimiter: createRateLimiter(TOTAL_LIMIT),
  };
  nextPeerNumber += 1;
  peers.set(peer.id, peer);

  socket.on('pong', () => {
    peer.alive = true;
  });

  socket.on('message', (raw) => {
    peer.alive = true;
    if (!peer.totalLimiter()) {
      peer.violations += 1;
      if (peer.violations > MAX_VIOLATIONS) socket.close(1008, 'rate abuse');
      return;
    }

    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!message || typeof message.t !== 'string') return;

    switch (message.t) {
      case 'join':
        handleJoin(peer, message);
        break;
      case 'move':
        if (peer.joined && peer.moveLimiter()) handleMove(peer, message);
        break;
      case 'chat':
        if (peer.joined && peer.chatLimiter()) handleChat(peer, message);
        break;
      case 'claim-guide':
        if (peer.joined) handleClaimGuide(peer, message);
        break;
      case 'release-guide':
        if (guideId === peer.id) setGuide(null);
        break;
      case 'ping':
        sendTo(peer, { t: 'pong', at: Date.now() });
        break;
      default:
        break;
    }
  });

  socket.on('close', () => closePeer(peer));
  socket.on('error', () => closePeer(peer));
});

const heartbeatInterval = setInterval(() => {
  for (const peer of peers.values()) {
    if (!peer.alive) {
      peer.socket.terminate();
      closePeer(peer);
      continue;
    }
    peer.alive = false;
    peer.socket.ping();
  }
}, 30000);

httpServer.listen(PORT, () => {
  console.log(`Presence server berjalan di port ${PORT} (passcode pemandu: ${GUIDE_PASSCODE ? 'aktif' : 'tidak diset'})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    clearInterval(heartbeatInterval);
    for (const peer of peers.values()) peer.socket.close(1001, 'server shutting down');
    httpServer.close(() => process.exit(0));
  });
}
