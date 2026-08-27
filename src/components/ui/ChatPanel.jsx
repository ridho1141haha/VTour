import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useTourStore } from '../../stores/useTourStore';
import { presence } from '../../lib/presence';

export function ChatPanel() {
  const isOpen = useTourStore((state) => state.isChatOpen);
  const setIsChatOpen = useTourStore((state) => state.setIsChatOpen);
  const messages = useTourStore((state) => state.chatMessages);
  const selfId = presence.selfId;
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!presence.sendChat(draft)) return;
    setDraft('');
  };

  return (
    <aside
      aria-label="Chat pengunjung"
      className="pointer-events-auto fixed bottom-24 right-4 z-30 flex max-h-[min(420px,60dvh)] w-[min(92vw,320px)] flex-col border border-zinc-700 bg-zinc-950/95 shadow-2xl backdrop-blur-md sm:bottom-16"
    >
      <header className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <span className="eyebrow mb-0">Chat Pengunjung</span>
        <button onClick={() => setIsChatOpen(false)} aria-label="Tutup chat" className="grid h-8 w-8 place-items-center text-zinc-500 hover:text-white">
          <X size={15} />
        </button>
      </header>

      <div ref={listRef} className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto px-3 py-2.5">
        {messages.length === 0 && (
          <p className="py-6 text-center text-xs text-zinc-600">Belum ada pesan. Sapa pengunjung lain!</p>
        )}
        {messages.map((message, index) => {
          const isSelf = message.id === selfId;
          return (
            <p key={`${message.at}-${index}`} className="text-xs leading-5">
              <span className={`font-mono text-[10px] ${isSelf ? 'text-orange-400' : 'text-emerald-400'}`}>
                {message.name}
              </span>
              <span className="text-zinc-500">: </span>
              <span className="text-zinc-200">{message.text}</span>
            </p>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 border-t border-zinc-800 p-2">
        <MessageCircle size={14} className="ml-1 shrink-0 text-zinc-600" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={200}
          placeholder="Tulis pesan..."
          aria-label="Tulis pesan chat"
          className="h-9 min-w-0 flex-1 border border-zinc-800 bg-zinc-900 px-2 text-xs text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Kirim pesan"
          className="grid h-9 w-9 shrink-0 place-items-center bg-orange-500 text-zinc-950 disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </form>
    </aside>
  );
}
