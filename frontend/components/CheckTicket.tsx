'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { apiUrl, TicketCheckResult } from '@/lib/api';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

const PHONE_RE = /^(\+251[79]\d{8}|0[79]\d{8})$/;

export default function CheckTicket() {
  const [phone, setPhone] = useState('');
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TicketCheckResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = resultRef.current;
    if (!el || !result || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      el,
      { y: 16, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }
    );
    return () => {
      tween.kill();
    };
  }, [result]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!PHONE_RE.test(phone.trim())) {
      setError('Enter the phone number you registered with, e.g. 0912345678.');
      return;
    }
    if (!/^\d{4,10}$/.test(number.trim())) {
      setError('Enter your ticket number (digits only).');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${apiUrl()}/api/tickets/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), ticketNumber: number.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(json?.error?.message ?? json?.message ?? 'Lookup failed — try again.');
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed — try again.');
    } finally {
      setBusy(false);
    }
  }

  const statusMeta: Record<string, { label: string; cls: string }> = {
    active: { label: 'Active — in every draw', cls: 'bg-gold-400 text-pine-950' },
    pending: { label: 'Pending — payment under review', cls: 'bg-paper-200 text-ink-900' },
    rejected: { label: 'Rejected — contact support', cls: 'bg-clay-600 text-paper-50' },
  };

  return (
    <section id="check" className="grain scroll-mt-20 bg-pine-950 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
            Check my ticket
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-paper-50 sm:text-5xl">
            Is your number <em className="text-gold-300">in the drum?</em>
          </h2>
          <p className="mt-4 max-w-md text-paper-100/70">
            Enter the phone number you registered with and your ticket number.
            We’ll tell you its status — and whether it has already won
            something.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-paper-50/10 bg-pine-900 p-6 sm:p-8"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ck-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-paper-100/60">
                Phone number
              </label>
              <input
                id="ck-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full rounded-lg border border-paper-50/15 bg-pine-950 px-3.5 py-2.5 text-paper-50 placeholder-paper-100/30 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
            <div>
              <label htmlFor="ck-number" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-paper-100/60">
                Ticket number
              </label>
              <input
                id="ck-number"
                type="text"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. 229714"
                className="digits w-full rounded-lg border border-paper-50/15 bg-pine-950 px-3.5 py-2.5 text-paper-50 placeholder-paper-100/30 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-gold-300">{error}</p>}

          {result && (
            <div ref={resultRef} className="mt-5 rounded-xl border border-paper-50/10 bg-pine-950 p-5">
              {result.found ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="digits font-display text-2xl font-semibold text-paper-50">
                      Nº {result.ticketNumber}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusMeta[result.ticketStatus ?? 'pending']?.cls}`}
                    >
                      {statusMeta[result.ticketStatus ?? 'pending']?.label}
                    </span>
                  </div>
                  {result.lottery && (
                    <p className="mt-1 text-sm text-paper-100/60">{result.lottery}</p>
                  )}
                  {result.wins && result.wins.length > 0 && (
                    <div className="mt-3 rounded-lg bg-gold-400 px-4 py-3 text-pine-950">
                      <p className="font-bold">
                        🎉 This ticket won{' '}
                        {result.wins.map((w) => w.prizeName).join(' and ')}!
                      </p>
                      <p className="text-sm">Contact us to claim your prize.</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-paper-100/80">
                  No ticket matches that phone + number. Check both entries —
                  or your entry may still be awaiting its number.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-shine mt-5 w-full rounded-full bg-gold-400 px-6 py-3 font-bold text-pine-950 transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Checking…' : 'Check status'}
          </button>
        </form>
      </div>
    </section>
  );
}
