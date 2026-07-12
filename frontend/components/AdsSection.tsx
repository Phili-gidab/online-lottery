import { Ad, mediaUrl } from '@/lib/api';

export default function AdsSection({ ads }: { ads: Ad[] }) {
  return (
    <section className="border-t border-paper-200 bg-paper-100 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.24em] text-ink-400">
          Sponsored
        </p>

        {ads.length === 0 ? (
          <div className="mx-auto flex h-28 max-w-3xl items-center justify-center rounded-2xl border-2 border-dashed border-paper-300 text-sm font-medium text-ink-400">
            Your brand here — advertise to every ticket-holder in the country
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => {
              const image = mediaUrl(ad.image?.url);
              const banner = image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={ad.sponsorName ?? 'Advertisement'}
                  className="h-28 w-full rounded-2xl object-cover"
                />
              ) : null;

              return ad.linkUrl ? (
                <a
                  key={ad.documentId}
                  href={ad.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="card-lift block overflow-hidden rounded-2xl"
                >
                  {banner}
                </a>
              ) : (
                <div key={ad.documentId} className="overflow-hidden rounded-2xl">
                  {banner}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
