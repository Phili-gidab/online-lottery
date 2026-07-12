import Reveal from '@/components/Reveal';
import { HOUSE_PHOTOS } from '@/lib/api';

/** Editorial collage of the flagship (house) prize photos. */
export default function FlagshipGallery() {
  return (
    <section className="bg-paper-100 py-20 sm:py-28" style={{ ['--notch' as string]: 'var(--color-paper-100)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600">
            The first prize
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-pine-900 sm:text-5xl">
            Not a picture of a house.{' '}
            <em className="text-gold-600">The</em> house.
          </h2>
          <p className="mt-4 max-w-xl text-ink-600">
            Two storeys behind a walled compound — curved glass bay, balcony,
            private yard. The winning ticket takes the keys, the paperwork, and
            the address.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
          <Reveal className="col-span-2 md:row-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOUSE_PHOTOS.wide}
              alt="The prize house — street view"
              className="h-full min-h-64 w-full rounded-2xl object-cover"
            />
          </Reveal>
          <Reveal delay={120}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOUSE_PHOTOS.heroPortrait}
              alt="Curved glass bay and balcony"
              className="h-full min-h-40 w-full rounded-2xl object-cover"
            />
          </Reveal>
          <Reveal delay={200}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOUSE_PHOTOS.portraitAlt}
              alt="Front entrance"
              className="h-full min-h-40 w-full rounded-2xl object-cover"
            />
          </Reveal>
          <Reveal delay={280} className="col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOUSE_PHOTOS.yard}
              alt="Walled compound and yard"
              className="h-full min-h-40 w-full rounded-2xl object-cover"
            />
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-ink-600">
            <span className="rounded-full border border-paper-300 bg-paper-50 px-4 py-1.5">Two storeys</span>
            <span className="rounded-full border border-paper-300 bg-paper-50 px-4 py-1.5">Walled compound</span>
            <span className="rounded-full border border-paper-300 bg-paper-50 px-4 py-1.5">Private yard</span>
            <span className="rounded-full border border-paper-300 bg-paper-50 px-4 py-1.5">Balcony &amp; glass bay</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
