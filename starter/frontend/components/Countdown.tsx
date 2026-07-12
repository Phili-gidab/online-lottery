'use client';

import { useEffect, useState } from 'react';

function parts(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor(diff / 3_600_000) % 24,
    m: Math.floor(diff / 60_000) % 60,
    s: Math.floor(diff / 1000) % 60,
    over: diff <= 0,
  };
}

export default function Countdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const [t, setT] = useState<ReturnType<typeof parts> | null>(null);

  useEffect(() => {
    setT(parts(target));
    const id = setInterval(() => setT(parts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t) {
    return <span className="digits text-2xl font-bold text-gold-300">— : — : —</span>;
  }
  if (t.over) {
    return <span className="text-lg font-bold text-gold-300">Draw imminent — stay tuned</span>;
  }

  const cell = (v: number, label: string) => (
    <span className="flex flex-col items-center">
      <span className="digits font-display text-3xl font-semibold text-paper-50 sm:text-4xl">
        {String(v).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
        {label}
      </span>
    </span>
  );

  return (
    <span className="flex items-start gap-4">
      {cell(t.d, 'days')}
      <span className="pt-1 font-display text-2xl text-gold-500">·</span>
      {cell(t.h, 'hrs')}
      <span className="pt-1 font-display text-2xl text-gold-500">·</span>
      {cell(t.m, 'min')}
      <span className="pt-1 font-display text-2xl text-gold-500">·</span>
      {cell(t.s, 'sec')}
    </span>
  );
}
