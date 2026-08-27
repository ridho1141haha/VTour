export const PEER_INTERPOLATION_RATE = 10;
export const MOVE_SEND_INTERVAL_MS = 150;
export const MOVE_SEND_MIN_DISTANCE = 0.35;

export function normalizeAngle(angle) {
  return ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

export function lerpAngle(current, target, t) {
  const difference = ((target - current + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return normalizeAngle(current + difference * t);
}

export function stepPeer(peer, delta) {
  const t = 1 - Math.exp(-PEER_INTERPOLATION_RATE * delta);
  peer.x += (peer.tx - peer.x) * t;
  peer.z += (peer.tz - peer.z) * t;
  peer.yaw = lerpAngle(peer.yaw, peer.tyaw, t);
}

export function sanitizeClientName(rawName) {
  const cleaned = typeof rawName === 'string' ? rawName.replace(/\s+/g, ' ').trim().slice(0, 20) : '';
  return cleaned || null;
}

export function createPresenceClient({ url, onEvent, getName }) {
  let socket = null;
  let status = 'idle';
  let selfId = null;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let pingTimer = null;
  let intentionalClose = false;
  let lastSent = { x: null, z: null, at: 0 };

  const peers = new Map();

  const emit = (event, payload) => onEvent?.(event, payload);

  const setStatus = (next) => {
    if (status === next) return;
    status = next;
    emit('status', next);
  };

  const clearTimers = () => {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
  };

  const scheduleReconnect = () => {
    if (reconnectTimer) return;
    const delay = Math.min(8000, 1000 * 2 ** reconnectAttempt);
    reconnectAttempt += 1;
    setStatus('connecting');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const handleMessage = (raw) => {
    let message;
    try {
      message = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
    } catch {
      return;
    }
    if (!message || typeof message.t !== 'string') return;

    switch (message.t) {
      case 'welcome': {
        selfId = message.id;
        peers.clear();
        for (const peer of message.peers ?? []) {
          peers.set(peer.id, { ...peer, tx: peer.x, tz: peer.z, tyaw: peer.yaw });
        }
        reconnectAttempt = 0;
        setStatus('online');
        emit('roster', [...peers.values()]);
        emit('chat-history', message.chat ?? []);
        emit('guide', message.guideId ? { id: message.guideId, name: message.guideName } : null);
        break;
      }
      case 'peer-join': {
        const peer = message.peer;
        if (!peer || peers.has(peer.id)) break;
        peers.set(peer.id, { ...peer, tx: peer.x, tz: peer.z, tyaw: peer.yaw });
        emit('roster', [...peers.values()]);
        break;
      }
      case 'peer-leave': {
        if (!peers.delete(message.id)) break;
        emit('roster', [...peers.values()]);
        break;
      }
      case 'peer-rename': {
        const peer = peers.get(message.id);
        if (!peer) break;
        peer.name = message.name;
        emit('roster', [...peers.values()]);
        break;
      }
      case 'peer-move': {
        const peer = peers.get(message.id);
        if (!peer) break;
        peer.tx = message.x;
        peer.tz = message.z;
        peer.tyaw = message.yaw;
        break;
      }
      case 'chat': {
        emit('chat', { id: message.id, name: message.name, text: message.text, at: message.at });
        break;
      }
      case 'guide': {
        emit('guide', message.guideId ? { id: message.guideId, name: message.guideName } : null);
        break;
      }
      case 'guide-taken': {
        emit('guide-taken', message.guideName ?? null);
        break;
      }
      case 'error': {
        emit('error', message);
        break;
      }
      default:
        break;
    }
  };

  const connect = () => {
    if (!url) {
      setStatus('disabled');
      return;
    }
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

    intentionalClose = false;
    setStatus('connecting');
    try {
      socket = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      socket.send(JSON.stringify({ t: 'join', name: getName?.() ?? '' }));
      pingTimer = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ t: 'ping', at: Date.now() }));
      }, 25000);
    };
    socket.onmessage = (event) => handleMessage(event.data);
    socket.onclose = () => {
      clearTimers();
      selfId = null;
      if (peers.size > 0) {
        peers.clear();
        emit('roster', []);
      }
      if (intentionalClose) setStatus('idle');
      else scheduleReconnect();
    };
    socket.onerror = () => {
      socket?.close();
    };
  };

  return {
    peers,
    get status() { return status; },
    get selfId() { return selfId; },
    connect,
    disconnect() {
      intentionalClose = true;
      clearTimers();
      if (socket) {
        socket.close(1000, 'client disconnect');
        socket = null;
      }
      if (peers.size > 0) {
        peers.clear();
        emit('roster', []);
      }
      setStatus('idle');
    },
    sendMove(x, z, yaw) {
      if (socket?.readyState !== WebSocket.OPEN) return;
      const now = performance.now();
      const movedEnough = lastSent.x === null
        || Math.hypot(x - lastSent.x, z - lastSent.z) >= MOVE_SEND_MIN_DISTANCE;
      if (!movedEnough || now - lastSent.at < MOVE_SEND_INTERVAL_MS) return;
      lastSent = { x, z, at: now };
      socket.send(JSON.stringify({ t: 'move', x, z, yaw }));
    },
    updateName(name) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ t: 'join', name: name ?? '' }));
      }
    },
    sendChat(text) {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      const cleaned = typeof text === 'string' ? text.trim().slice(0, 200) : '';
      if (!cleaned) return false;
      socket.send(JSON.stringify({ t: 'chat', text: cleaned }));
      return true;
    },
    claimGuide(passcode) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ t: 'claim-guide', passcode: passcode ?? '' }));
      }
    },
    releaseGuide() {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ t: 'release-guide' }));
      }
    },
    getGuidePosition(guideIdValue) {
      const guide = guideIdValue ? peers.get(guideIdValue) : null;
      return guide ? { x: guide.tx, z: guide.tz } : null;
    },
  };
}
