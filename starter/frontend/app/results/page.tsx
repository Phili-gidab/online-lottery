'use client';

import { useEffect, useState } from 'react';
import { CATEGORY_META, fmtDate, getAllLotteries, Lottery, ORDINALS } from '@/lib/api';

export default function ResultsPage() {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllLotteries()
      .then(setLotteries)
      .finally(() => setLoaded(true));
  }, []);

  const withDrawn = lotteries.filter((l) => l.draws.some((d) => d.drawStatus === 'drawn'));

  return (
    <main className="min-h-screen bg-paper-50">
      <section className="grain bg-pine-950 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">Results</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-paper-50 sm:text-5xl">
            Every winner, on the record.
          </h1>
          <p className="mt-3 max-w-xl text-paper-100/70">
            Winning ticket numbers are published the moment a draw is executed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {withDrawn.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-paper-300 p-16 text-center text-ink-400">
            {loaded
              ? 'No draws have been executed yet — the first results will appear here.'
              : 'Loading results…'}
          </div>
        ) : (
          <div className="space-y-12">
            {withDrawn.map((lottery) => (
              <div key={lottery.documentId}>
                <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-2xl font-semibold text-pine-900">
                    {lottery.title}
                  </h2>
                  <span className="text-sm text-ink-400">by {lottery.company}</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-paper-200 bg-white">
                  {lottery.draws
                    .filter((d) => d.drawStatus === 'drawn')
                    .map((d, i, arr) => {
                      const meta = CATEGORY_META[d.category] ?? CATEGORY_META.other;
                      return (
                        <div
                          key={d.documentId}
                          className={`flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-5 ${
                            i < arr.length - 1 ? 'border-b border-paper-200' : ''
                          }`}
                        >
                          <span className="w-28 text-xs font-bold uppercase tracking-[0.16em] text-ink-400">
                            {ORDINALS[d.drawNumber - 1] ?? `#${d.drawNumber}`} draw
                          </span>
                          <span className="min-w-40 flex-1 font-display text-lg font-semibold text-pine-900">
                            {meta.icon} {d.prizeName}
                          </span>
                          <span className="digits rounded-lg bg-pine-950 px-4 py-1.5 font-display text-lg font-semibold text-gold-300">
                            Nº {d.winnerTicketNumber}
                          </span>
                          <span className="text-sm font-medium text-ink-600">
                            {d.winnerDisplayName}
                          </span>
                          {d.drawnAt && (
                            <span className="ml-auto text-xs text-ink-400">
                              {fmtDate(d.drawnAt)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
