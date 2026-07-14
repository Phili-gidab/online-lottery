import Reveal from '@/components/Reveal';
import EnterLink from '@/components/EnterLink';
import { Lottery, mediaUrl } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hahuplay.com';

/** The campaign's promo poster (admin upload) — view, share, download. */
export default function PosterSection({ lottery }: { lottery: Lottery }) {
  const poster = mediaUrl(lottery.poster?.url);
  if (!poster) return null;

  const shareText = `${lottery.title} — ${
    lottery.ticketPrice ? `${lottery.ticketPrice.toLocaleString()} ETB per ticket. ` : ''
  }One ticket enters every draw. ${SITE_URL}`;
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(shareText)}`;

  return (
    <section className="grain scroll-mt-20 bg-pine-950 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt={`${lottery.title} — official poster`}
            className="card-lift mx-auto max-h-[600px] w-auto max-w-full rounded-2xl shadow-[0_40px_90px_-40px_rgba(0,0,0,0.8)] ring-1 ring-gold-500/30"
          />
        </Reveal>

        <Reveal className="order-1 lg:order-2">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
            The official poster
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-paper-50 sm:text-5xl">
            Take the draw <em className="text-gold-300">with you.</em>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-paper-100/70">
            Save the poster, forward it on Telegram, print it for the shop
            wall. Every friend who enters makes the draw bigger — and the
            ticket link is right on the poster.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={telegramShare}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-pine-950 transition hover:bg-gold-300"
            >
              Share on Telegram
            </a>
            <a
              href={poster}
              download
              className="rounded-full border border-paper-50/25 px-6 py-3 text-sm font-bold text-paper-50 transition hover:border-gold-400 hover:text-gold-300"
            >
              Download poster
            </a>
            <EnterLink className="rounded-full border border-paper-50/25 px-6 py-3 text-sm font-bold text-paper-50 transition hover:border-gold-400 hover:text-gold-300">
              Get your ticket →
            </EnterLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
