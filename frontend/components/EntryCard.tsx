'use client';

import { useEffect, useRef, useState } from 'react';
import { getStats, Lottery, LotteryStats } from '@/lib/api';
import RegistrationForm from '@/components/RegistrationForm';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

/** The app-style entry widget that lives in the hero. */
export default function EntryCard({ lottery }: { lottery: Lottery }) {
  const [stats, setStats] = useState<LotteryStats | null>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getStats(lottery.documentId).then(setStats);
  }, [lottery.documentId]);

  const max = stats?.maxTickets ?? lottery.maxTickets ?? null;
  const sold = stats ? stats.activeTickets + stats.pendingTickets : null;
  const pct = max && sold !== null ? Math.min(100, Math.round((sold / max) * 100)) : null;
  const soldOut = stats?.soldOut ?? false;

  useEffect(() => {
    const el = fillRef.current;
    if (!el || pct === null) return;
    if (prefersReducedMotion()) {
      el.style.width = `${pct}%`;
      return;
    }
    const tween = gsap.to(el, { width: `${pct}%`, duration: 1.4, ease: 'power3.out' });
    return () => {
      tween.kill();
    };
  }, [pct]);

  return (
    <div className="overflow-hidden rounded-3xl bg-paper-50 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
      {/* card header */}
      <div className="flex items-center justify-between gap-3 border-b border-paper-200 bg-white px-6 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">
            {soldOut ? 'Sold out' : 'Enter now'}
          </p>
          <p className="font-display text-lg font-semibold leading-tight text-pine-900">
            {lottery.title}
          </p>
        </div>
        {lottery.ticketPrice && (
          <span className="rounded-full bg-pine-900 px-4 py-1.5 text-sm font-bold text-gold-300">
            {lottery.ticketPrice.toLocaleString()} ETB
          </span>
        )}
      </div>

      <div className="p-6">
        {/* limited-edition progress — only when the campaign has a cap */}
        {pct !== null && (
          <div className="mb-5">
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-bold uppercase tracking-[0.14em] text-ink-600">
                {sold!.toLocaleString()} of {max!.toLocaleString()} tickets claimed
              </span>
              <span className="digits font-bold text-gold-600">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-paper-200">
              <div
                ref={fillRef}
                className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300"
                style={{ width: 0 }}
              />
            </div>
          </div>
        )}

        {soldOut ? (
          <div className="rounded-2xl border-2 border-dashed border-paper-300 p-8 text-center">
            <p className="font-display text-2xl font-semibold text-pine-900">
              All tickets are claimed.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Registration for this campaign has closed. Winners will be
              published here and notified by SMS — good luck to everyone
              holding a ticket!
            </p>
          </div>
        ) : (
          <>
            {/* step 1 — how to pay */}
            {lottery.paymentInstructions && (
              <details className="faq group mb-5 rounded-xl border border-gold-500/40 bg-gold-200/25 px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em] text-gold-700">
                  Step 1 — how to pay
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-900">
                  {lottery.paymentInstructions}
                </p>
              </details>
            )}

            {/* step 2 — the form */}
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-ink-400">
              Step 2 — register your entry
            </p>
            <RegistrationForm
              lotteryDocumentId={lottery.documentId}
              lotteryTitle={lottery.title}
              ticketPrice={lottery.ticketPrice}
            />
          </>
        )}
      </div>
    </div>
  );
}
