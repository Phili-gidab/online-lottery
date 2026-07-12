import Link from 'next/link';
import MyTickets from '@/components/MyTickets';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-pine-900/10 bg-paper-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="inline-block h-2.5 w-2.5 translate-y-[-1px] rounded-full bg-gold-500 transition group-hover:scale-125" />
          <span className="font-display text-2xl font-semibold tracking-tight text-pine-900">
            HahuPlay
          </span>
          <span className="text-sm font-medium text-gold-600">ሀሁ</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-600 md:flex">
          <Link href="/#prizes" className="transition hover:text-pine-900">
            Prizes
          </Link>
          <Link href="/#how" className="transition hover:text-pine-900">
            How it works
          </Link>
          <Link href="/#check" className="transition hover:text-pine-900">
            Check my ticket
          </Link>
          <Link href="/results" className="transition hover:text-pine-900">
            Results
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <MyTickets />
          <Link
            href="/#enter"
            className="btn-shine rounded-full bg-pine-900 px-5 py-2.5 text-sm font-bold text-paper-50 transition hover:bg-pine-800"
          >
            Get a ticket
          </Link>
        </div>
      </div>
    </header>
  );
}
