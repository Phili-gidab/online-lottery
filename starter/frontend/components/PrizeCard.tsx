import { CATEGORY_META, Draw, fmtDate, ORDINALS, prizeImageUrl } from '@/lib/api';

/** Ticket-stub prize card: image, perforated edge, then the "stub" body. */
export default function PrizeCard({ draw }: { draw: Draw }) {
  const meta = CATEGORY_META[draw.category] ?? CATEGORY_META.other;
  const ordinal = ORDINALS[draw.drawNumber - 1] ?? `#${draw.drawNumber}`;
  const image = prizeImageUrl(draw);
  const drawn = draw.drawStatus === 'drawn';

  return (
    <article className="card-lift group relative flex h-full flex-col rounded-2xl bg-white shadow-[0_10px_30px_-18px_rgba(7,27,20,0.4)]">
      {/* image */}
      <div className="relative h-56 overflow-hidden rounded-t-2xl">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={draw.prizeName}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-pine-900 text-7xl">
            {meta.icon}
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-pine-950/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-300 backdrop-blur">
          {ordinal} draw
        </span>
        {drawn && (
          <span className="absolute right-4 top-4 rounded-full bg-gold-400 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-pine-950">
            Drawn
          </span>
        )}
      </div>

      {/* perforation */}
      <div className="perf mx-0" />

      {/* stub */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">
            {meta.icon} {meta.label}
          </span>
          {!drawn && draw.drawDate && (
            <span className="text-xs font-medium text-ink-600">{fmtDate(draw.drawDate)}</span>
          )}
        </div>

        <h3 className="font-display text-2xl font-semibold leading-snug text-pine-900">
          {draw.prizeName}
        </h3>

        {drawn ? (
          <div className="mt-auto rounded-xl bg-gradient-to-r from-gold-300 via-gold-200 to-gold-300 p-[1.5px]">
            <div className="rounded-[10px] bg-pine-950 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-400">
                Winning ticket
              </p>
              <p className="digits mt-0.5 font-display text-2xl font-semibold text-paper-50">
                Nº {draw.winnerTicketNumber}
              </p>
              {draw.winnerDisplayName && (
                <p className="text-sm text-paper-100/80">{draw.winnerDisplayName}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-auto text-sm leading-relaxed text-ink-600">
            Every active ticket is automatically entered.
          </p>
        )}
      </div>
    </article>
  );
}
