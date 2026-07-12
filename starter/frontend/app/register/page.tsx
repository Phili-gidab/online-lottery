'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CATEGORY_META, getLottery, getOpenLotteries, Lottery, ORDINALS } from '@/lib/api';
import RegistrationForm from '@/components/RegistrationForm';

function RegisterInner() {
  const params = useSearchParams();
  const requestedId = params.get('l');

  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      // Requested campaign, or fall back to the currently open one.
      const found = requestedId
        ? await getLottery(requestedId)
        : (await getOpenLotteries())[0] ?? null;
      setLottery(found && found.lotteryStatus === 'open' ? found : null);
    })().finally(() => setLoaded(true));
  }, [requestedId]);

  if (!loaded) {
    return (
      <div className="py-32 text-center text-ink-400">Loading…</div>
    );
  }

  if (!lottery) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <p className="font-display text-2xl font-semibold text-pine-900">
          This lottery isn’t open for entry.
        </p>
        <Link href="/" className="mt-4 inline-block font-semibold text-gold-600 hover:underline">
          ← Back to the draws
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="text-sm font-semibold text-pine-700 transition hover:text-pine-900"
      >
        ← Back to the draws
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        {/* left: payment instructions & what you're entering */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600">
            Enter the draw
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-pine-900">
            {lottery.title}
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            by {lottery.company} · one entry = one ticket, valid for all{' '}
            {lottery.draws.length} draws
          </p>

          <ul className="mt-6 space-y-2">
            {lottery.draws.map((d) => {
              const meta = CATEGORY_META[d.category] ?? CATEGORY_META.other;
              return (
                <li
                  key={d.documentId}
                  className="flex items-center gap-3 rounded-xl border border-paper-200 bg-white px-4 py-3 text-sm"
                >
                  <span className="text-xl">{meta.icon}</span>
                  <span className="font-semibold text-pine-900">{d.prizeName}</span>
                  <span className="ml-auto text-xs font-bold uppercase tracking-wider text-ink-400">
                    {ORDINALS[d.drawNumber - 1]} draw
                  </span>
                </li>
              );
            })}
          </ul>

          {lottery.paymentInstructions && (
            <div className="mt-8 rounded-2xl border border-gold-500/40 bg-gold-200/25 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-700">
                Step 1 — how to pay
                {lottery.ticketPrice
                  ? ` · ${lottery.ticketPrice.toLocaleString()} ETB per ticket`
                  : ''}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-900">
                {lottery.paymentInstructions}
              </p>
              <p className="mt-3 text-xs text-ink-600">
                Then complete step 2 → register with your receipt’s reference
                number and a screenshot.
              </p>
            </div>
          )}
        </div>

        {/* right: the form */}
        <div className="rounded-2xl border border-paper-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(7,27,20,0.35)] sm:p-8">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-ink-400">
            Step 2 — register your entry
          </p>
          <RegistrationForm
            lotteryDocumentId={lottery.documentId}
            lotteryTitle={lottery.title}
            ticketPrice={lottery.ticketPrice}
          />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-paper-50">
      <Suspense fallback={<div className="py-32 text-center text-ink-400">Loading…</div>}>
        <RegisterInner />
      </Suspense>
    </main>
  );
}
