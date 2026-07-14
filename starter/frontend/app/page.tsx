'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Ad,
  CATEGORY_META,
  getAds,
  getOpenLotteries,
  HOUSE_PHOTOS,
  Lottery,
  ORDINALS,
} from '@/lib/api';
import { gsap, prefersReducedMotion } from '@/lib/gsap';
import Reveal from '@/components/Reveal';
import EnterLink from '@/components/EnterLink';
import PrizeCard from '@/components/PrizeCard';
import PosterSection from '@/components/PosterSection';
import EntryCard from '@/components/EntryCard';
import WinnersTicker from '@/components/WinnersTicker';
import FlagshipGallery from '@/components/FlagshipGallery';
import HowItWorks from '@/components/HowItWorks';
import StatsBand from '@/components/StatsBand';
import CheckTicket from '@/components/CheckTicket';
import FAQ from '@/components/FAQ';
import AdsSection from '@/components/AdsSection';

export default function HomePage() {
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loaded, setLoaded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const heroBgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    Promise.all([getOpenLotteries(), getAds()])
      .then(([lotteries, adList]) => {
        setLottery(lotteries[0] ?? null);
        setAds(adList);
      })
      .finally(() => setLoaded(true));
  }, []);

  // The house backdrop drifts slowly as you scroll past the hero.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroBgRef.current,
        { yPercent: -8, scale: 1.15 },
        {
          yPercent: 10,
          scale: 1.05,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <main>
      {/* ================= HERO — the app screen ================= */}
      <section
        ref={heroRef}
        className="grain relative overflow-hidden bg-pine-950"
      >
        {/* backdrop: the prize itself */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={heroBgRef}
            src={HOUSE_PHOTOS.wide}
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-pine-950 via-pine-950/90 to-pine-900/75" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:gap-12 lg:pb-14 lg:pt-12">
          {/* left: the pitch */}
          <div>
            <p className="rise d1 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-pine-900/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-300">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
              {!loaded
                ? 'Loading…'
                : lottery
                  ? `${lottery.title} — live`
                  : 'Next campaign coming soon'}
            </p>

            <h1 className="rise d2 mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-tight text-paper-50 sm:text-5xl lg:text-6xl">
              One ticket.
              <br />
              Three prizes.
              <br />
              <em className="shimmer-text">Your new address.</em>
            </h1>

            <p className="rise d3 mt-4 max-w-md text-lg leading-relaxed text-paper-100/75">
              Pay once, upload your receipt, and your ticket enters{' '}
              <strong className="text-paper-50">every draw</strong> — the house,
              the car, the phone.
            </p>

            {/* the draws, at a glance */}
            {lottery && (
              <ul className="rise d4 mt-5 max-w-md space-y-2">
                {lottery.draws.map((d) => {
                  const meta = CATEGORY_META[d.category] ?? CATEGORY_META.other;
                  return (
                    <li
                      key={d.documentId}
                      className="flex items-center gap-3 rounded-xl border border-paper-50/10 bg-paper-50/5 px-4 py-2 text-sm backdrop-blur-sm"
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <span className="font-semibold text-paper-50">{d.prizeName}</span>
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-gold-300/80">
                        {d.drawStatus === 'drawn'
                          ? `Won · Nº ${d.winnerTicketNumber}`
                          : `${ORDINALS[d.drawNumber - 1]} draw`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="rise d5 mt-5 text-xs text-paper-100/40">
              18+ only · Manual payment via Telebirr / bank transfer · Winners
              notified by SMS &amp; published here ·{' '}
              <Link href="/#how" className="underline hover:text-gold-300">
                How it works
              </Link>
            </p>
          </div>

          {/* right: the entry card — the app. #enter lives here so every
              "Get a ticket" CTA lands the user directly on the form. */}
          <div id="enter" className="rise d3 scroll-mt-24 lg:sticky lg:top-24">
            {lottery ? (
              <EntryCard lottery={lottery} />
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-paper-50/20 p-14 text-center text-paper-100/50">
                {loaded ? 'The next campaign opens soon.' : 'Loading…'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= WINNERS TICKER ================= */}
      {lottery && <WinnersTicker draws={lottery.draws} />}

      {/* ================= STATS ================= */}
      {lottery && <StatsBand lottery={lottery} />}

      {/* ================= PRIZES ================= */}
      <section
        id="prizes"
        className="scroll-mt-20 bg-paper-100 py-20 sm:py-28"
        style={{ ['--notch' as string]: 'var(--color-paper-100)' }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600">
                {lottery ? `by ${lottery.company}` : 'Prizes'}
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-pine-900 sm:text-5xl">
                Every draw, one ticket.
              </h2>
            </div>
            {lottery && (
              <EnterLink className="btn-shine rounded-full bg-pine-900 px-6 py-3 text-sm font-bold text-paper-50 transition hover:bg-pine-800">
                Enter now →
              </EnterLink>
            )}
          </Reveal>

          {!lottery ? (
            <div className="mt-12 rounded-2xl border-2 border-dashed border-paper-300 p-16 text-center text-ink-400">
              {loaded ? 'No campaign is open right now — check back soon.' : 'Loading draws…'}
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {lottery.draws.map((draw, i) => (
                <Reveal key={draw.documentId} delay={i * 120}>
                  <PrizeCard draw={draw} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= FLAGSHIP GALLERY ================= */}
      <FlagshipGallery />

      {/* ================= CAMPAIGN POSTER ================= */}
      {lottery && <PosterSection lottery={lottery} />}

      {/* ================= HOW IT WORKS ================= */}
      <HowItWorks />

      {/* ================= CHECK TICKET ================= */}
      <CheckTicket />

      {/* ================= FAQ ================= */}
      <FAQ />

      {/* ================= ADS ================= */}
      <AdsSection ads={ads} />
    </main>
  );
}
