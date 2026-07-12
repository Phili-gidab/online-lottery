import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="grain bg-pine-950 text-paper-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-semibold text-paper-50">
            Edil <span className="text-lg font-medium text-gold-400">እድል</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper-100/70">
            The grand prize draw. One ticket enters every draw — verified
            payments, provable draws, published winners.
          </p>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
            Play
          </p>
          <ul className="space-y-2 text-paper-100/80">
            <li><Link href="/#prizes" className="hover:text-paper-50">Current prizes</Link></li>
            <li><Link href="/#how" className="hover:text-paper-50">How it works</Link></li>
            <li><Link href="/#check" className="hover:text-paper-50">Check my ticket</Link></li>
            <li><Link href="/results" className="hover:text-paper-50">Past results</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
            Contact
          </p>
          <ul className="space-y-2 text-paper-100/80">
            <li>Telegram: @edildraws (demo)</li>
            <li>Phone: 09 12 34 56 78 (demo)</li>
            <li>Addis Ababa, Ethiopia</li>
          </ul>
        </div>
      </div>

      <div className="tricolor" />
      <div className="bg-pine-950 py-5 text-center text-xs text-paper-100/50">
        © 2026 Edil (demo build) · Players must be 18 or older · Play
        responsibly — set limits, and never play with money you need.
        <span className="mx-2">·</span>
        <Link href="/terms" className="underline hover:text-paper-50">Terms</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="underline hover:text-paper-50">Privacy</Link>
      </div>
    </footer>
  );
}
