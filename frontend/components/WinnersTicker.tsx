import { CATEGORY_META, Draw } from '@/lib/api';

/** Marquee strip of published winners — shown only when draws have run. */
export default function WinnersTicker({ draws }: { draws: Draw[] }) {
  const drawn = draws.filter((d) => d.drawStatus === 'drawn' && d.winnerTicketNumber);
  if (drawn.length === 0) return null;

  const items = drawn.map((d) => {
    const meta = CATEGORY_META[d.category] ?? CATEGORY_META.other;
    return `${meta.icon} Nº ${d.winnerTicketNumber} — ${d.winnerDisplayName} won the ${d.prizeName}`;
  });
  // Duplicate so the loop is seamless.
  const loop = [...items, ...items, ...items, ...items];

  return (
    <div className="ticker border-y border-gold-500/25 bg-gold-400 py-2.5">
      <div className="ticker-track">
        {loop.map((text, i) => (
          <span
            key={i}
            className="digits mx-8 whitespace-nowrap text-sm font-bold text-pine-950"
          >
            {text}
            <span className="ml-16 text-pine-950/40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
