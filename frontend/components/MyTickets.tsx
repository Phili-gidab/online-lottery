'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ENTRIES_EVENT,
  EntryStatus,
  getEntryStatuses,
  getSavedEntries,
  removeEntry,
  SavedEntry,
} from '@/lib/api';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-gold-400 text-pine-950' },
  pending: { label: 'Pending', cls: 'bg-paper-200 text-ink-600' },
  rejected: { label: 'Rejected', cls: 'bg-clay-600 text-paper-50' },
};

export default function MyTickets() {
  const [entries, setEntries] = useState<SavedEntry[]>([]);
  const [statuses, setStatuses] = useState<Map<string, EntryStatus>>(new Map());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setEntries(getSavedEntries());
    sync();
    window.addEventListener(ENTRIES_EVENT, sync);
    return () => window.removeEventListener(ENTRIES_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!open || entries.length === 0) return;
    setLoading(true);
    getEntryStatuses(entries)
      .then((list) => setStatuses(new Map(list.map((s) => [s.documentId, s]))))
      .finally(() => setLoading(false));
  }, [open, entries]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (entries.length === 0) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-pine-900/15 bg-white px-4 py-2 text-sm font-bold text-pine-900 transition hover:border-gold-500"
      >
        🎟️ My tickets
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-[10px] font-bold text-pine-950">
          {entries.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-paper-200 bg-white shadow-[0_24px_60px_-20px_rgba(7,27,20,0.4)]">
          <div className="border-b border-paper-200 bg-paper-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-600">
            My tickets on this device {loading && '· refreshing…'}
          </div>
          <ul className="max-h-96 divide-y divide-paper-100 overflow-y-auto">
            {entries.map((e) => {
              const s = statuses.get(e.id);
              const meta = STATUS_META[s?.ticketStatus ?? 'pending'];
              return (
                <li key={e.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="digits font-display text-lg font-semibold text-pine-900">
                      {s?.ticketNumber ? `Nº ${s.ticketNumber}` : 'Nº pending'}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {e.name} · {s?.lottery ?? e.lottery}
                  </p>
                  {s?.wins && s.wins.length > 0 && (
                    <p className="mt-2 rounded-lg bg-gold-400 px-3 py-1.5 text-xs font-bold text-pine-950">
                      🎉 Won: {s.wins.map((w) => w.prizeName).join(', ')} — contact us to claim!
                    </p>
                  )}
                  <button
                    onClick={() => removeEntry(e.id)}
                    className="mt-1.5 text-[11px] font-semibold text-ink-400 hover:text-clay-600"
                  >
                    Remove from this device
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
