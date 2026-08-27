export const MAX_PEERS = 30;
export const MAX_NAME_LENGTH = 20;
export const MAX_CHAT_LENGTH = 200;

export const MAP_BOUNDS = {
  minX: -134,
  maxX: 47,
  minZ: -113,
  maxZ: 111,
};

const NAME_BLOCKLIST = ['anjing', 'bangsat', 'babi', 'tolol', 'goblok', 'jembut', 'kontol', 'memek', 'fuck', 'shit'];

function randomSuffix() {
  return String(Math.floor(10 + Math.random() * 90));
}

export function containsBlockedWord(text) {
  const normalized = text.toLowerCase();
  return NAME_BLOCKLIST.some((word) => normalized.includes(word));
}

export function sanitizeName(rawName) {
  if (typeof rawName !== 'string') return `Pengunjung-${randomSuffix()}`;
  const cleaned = rawName
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  if (!cleaned || containsBlockedWord(cleaned)) return `Pengunjung-${randomSuffix()}`;
  return cleaned;
}

export function sanitizeChat(rawText) {
  if (typeof rawText !== 'string') return null;
  const cleaned = rawText
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CHAT_LENGTH);
  return cleaned || null;
}

export function maskBlockedWords(text) {
  let masked = text;
  for (const word of NAME_BLOCKLIST) {
    const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    masked = masked.replace(pattern, (match) => '*'.repeat(match.length));
  }
  return masked;
}

export function clampMove(x, z, yaw) {
  if (![x, z, yaw].every((value) => typeof value === 'number' && Number.isFinite(value))) return null;
  return {
    x: Math.min(MAP_BOUNDS.maxX, Math.max(MAP_BOUNDS.minX, x)),
    z: Math.min(MAP_BOUNDS.maxZ, Math.max(MAP_BOUNDS.minZ, z)),
    yaw: ((yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
  };
}

export function createRateLimiter({ limit, windowMs }) {
  let count = 0;
  let windowStart = Date.now();
  return () => {
    const now = Date.now();
    if (now - windowStart >= windowMs) {
      windowStart = now;
      count = 0;
    }
    count += 1;
    return count <= limit;
  };
}
