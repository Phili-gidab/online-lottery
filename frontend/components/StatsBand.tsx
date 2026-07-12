'use client';

import { useEffect, useState } from 'react';
import { fmtDate, getStats, Lottery, LotteryStats, nextScheduledDraw } from '@/lib/api';
import CountUp from '@/components/fx/CountUp';

export default function StatsBand({ lottery }: { lottery: Lottery }) {
  const [stats, setStats] = useState<LotteryStats | null>(null);

  useEffect(() => {
    getStats(lottery.documentId).then(setStats);
  }, [lottery.documentId]);

  const next = nextScheduledDraw(lottery);

  const items: { label: string; node: React.ReactNode }[] = [
    {
      label: 'Tickets in play',
      node: stats ? <CountUp value={stats.activeTickets} /> : '—',
    },
    {
      label: 'Entries under review',
      node: stats ? <CountUp value={stats.pendingTickets} /> : '—',
    },
    {
      label: 'Ticket price',
      node: lottery.ticketPrice ? `${lottery.ticketPrice.toLocaleString()} ETB` : '—',
    },
    {
      label: 'Next draw',
      node: next?.drawDate ? fmtDate(next.drawDate)! : 'To be announced',
    },
  ];

  return (
    <div className="border-y border-gold-500/20 bg-pine-900">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-paper-50/10 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="px-6 py-6 text-center">
            <p className="digits font-display text-2xl font-semibold text-gold-300 sm:text-3xl">
              {it.node}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-paper-100/60">
              {it.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
