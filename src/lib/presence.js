import { createPresenceClient, sanitizeClientName } from './presenceClient';
import { useTourStore } from '../stores/useTourStore';

const NAME_STORAGE_KEY = 'virtual-tour-display-name';
const ENABLED_STORAGE_KEY = 'virtual-tour-presence-enabled';

export function getStoredDisplayName() {
  try {
    return sanitizeClientName(localStorage.getItem(NAME_STORAGE_KEY) ?? '');
  } catch {
    return null;
  }
}

export function getStoredPresenceEnabled() {
  try {
    return localStorage.getItem(ENABLED_STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

function resolvePresenceUrl() {
  const configured = import.meta.env.VITE_PRESENCE_URL;
  if (configured) return configured;
  return import.meta.env.DEV ? 'ws://localhost:8787' : null;
}

const presenceUrl = resolvePresenceUrl();
const store = () => useTourStore.getState();

export const presence = createPresenceClient({
  url: presenceUrl,
  getName: () => store().displayName,
  onEvent: (event, payload) => {
    switch (event) {
      case 'status':
        store().setPresenceStatus(payload);
        break;
      case 'roster':
        store().setPresenceRoster(payload.map(({ id, name }) => ({ id, name })));
        break;
      case 'chat':
        store().addChatMessage(payload);
        break;
      case 'chat-history':
        for (const entry of [...payload].reverse()) store().addChatMessage(entry, { silent: true });
        break;
      case 'guide':
        store().setPresenceGuide(payload);
        break;
      case 'guide-taken':
        store().setPresenceNotice(`Pemandu sudah ada: ${payload || 'pengunjung lain'}.`);
        break;
      case 'error':
        store().setPresenceNotice(payload.message ?? 'Terjadi kesalahan pada multiplayer.');
        break;
      default:
        break;
    }
  },
});

export function setDisplayName(name) {
  const cleaned = sanitizeClientName(name) ?? '';
  try {
    localStorage.setItem(NAME_STORAGE_KEY, cleaned);
  } catch { /* storage unavailable */ }
  const finalName = cleaned || `Pengunjung-${String(Math.floor(10 + Math.random() * 90))}`;
  store().setDisplayName(finalName);
  presence.updateName(finalName);
}

export function setPresenceEnabled(enabled) {
  try {
    localStorage.setItem(ENABLED_STORAGE_KEY, enabled ? '1' : '0');
  } catch { /* storage unavailable */ }
  store().setPresenceEnabled(enabled);
  if (!enabled) presence.disconnect();
}

export function initializePresenceSettings() {
  store().setDisplayName(getStoredDisplayName() ?? `Pengunjung-${String(Math.floor(10 + Math.random() * 90))}`);
  store().setPresenceEnabled(getStoredPresenceEnabled());
}
