import React, { useEffect } from 'react';
import { Crown, Footprints, MessageCircle, RadioTower, Users } from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';
import { presence } from '../../lib/presence';

const STATUS_LABEL = {
  idle: 'Offline',
  connecting: 'Menghubungkan...',
  online: 'Online',
  error: 'Gagal',
  disabled: 'Nonaktif',
};

export function PresencePanel() {
  const status = useTourStore((state) => state.presenceStatus);
  const peerCount = useTourStore((state) => state.peerCount);
  const guide = useTourStore((state) => state.guide);
  const chatUnread = useTourStore((state) => state.chatUnread);
  const isChatOpen = useTourStore((state) => state.isChatOpen);
  const setIsChatOpen = useTourStore((state) => state.setIsChatOpen);
  const presenceNotice = useTourStore((state) => state.presenceNotice);
  const teleportToPosition = useTourStore((state) => state.teleportToPosition);
  const setPresenceNotice = useTourStore((state) => state.setPresenceNotice);
  const selfId = presence.selfId;

  useEffect(() => {
    if (!presenceNotice) return undefined;
    const timer = window.setTimeout(() => setPresenceNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [presenceNotice, setPresenceNotice]);

  const isGuide = Boolean(guide && guide.id === selfId);
  const canFollow = Boolean(guide && guide.id !== selfId);

  const followGuide = () => {
    const position = presence.getGuidePosition(guide?.id);
    if (!position) {
      setPresenceNotice('Posisi pemandu belum tersedia.');
      return;
    }
    teleportToPosition(position.x, position.z);
  };

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-20 flex flex-col items-end gap-2 sm:bottom-4">
      {presenceNotice && (
        <div role="status" className="pointer-events-auto border border-amber-500/50 bg-zinc-950/95 px-3 py-2 text-xs text-amber-200 shadow-xl">
          {presenceNotice}
        </div>
      )}
      <div className="hud-panel pointer-events-auto flex items-center gap-1 p-1">
        <span
          className="flex items-center gap-1.5 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400"
          title={`Multiplayer: ${STATUS_LABEL[status] ?? status}`}
        >
          <RadioTower size={13} className={status === 'online' ? 'text-emerald-400' : 'text-zinc-500'} />
          <span className={`status-dot ${status === 'online' ? '' : 'opacity-40'}`} />
          <Users size={12} className="ml-0.5" />
          <span aria-live="polite">{status === 'online' ? peerCount + 1 : '—'}</span>
        </span>

        {status === 'online' && !guide && (
          <button
            onClick={() => presence.claimGuide('')}
            className="flex items-center gap-1.5 border-l border-zinc-700/60 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 hover:text-white"
            title="Kendalikan tur sebagai pemandu"
          >
            <Crown size={13} />Pemandu
          </button>
        )}
        {status === 'online' && isGuide && (
          <button
            onClick={() => presence.releaseGuide()}
            className="flex items-center gap-1.5 border-l border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
            title="Berhenti menjadi pemandu"
          >
            <Crown size={13} />Anda Pemandu
          </button>
        )}
        {status === 'online' && canFollow && (
          <button
            onClick={followGuide}
            className="flex items-center gap-1.5 border-l border-zinc-700/60 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 hover:text-white"
            title={`Teleport ke pemandu (${guide.name})`}
          >
            <Footprints size={13} />Ikuti {guide.name}
          </button>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-expanded={isChatOpen}
          aria-label="Buka chat pengunjung"
          className="relative flex items-center border-l border-zinc-700/60 px-2.5 py-1.5 text-zinc-300 hover:bg-white/5 hover:text-white"
        >
          <MessageCircle size={14} />
          {chatUnread > 0 && !isChatOpen && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-orange-500 px-1 font-mono text-[9px] font-bold text-zinc-950">
              {chatUnread > 9 ? '9+' : chatUnread}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
