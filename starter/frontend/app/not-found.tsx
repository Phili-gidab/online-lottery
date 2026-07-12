import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grain flex min-h-[70vh] items-center justify-center bg-pine-950 px-4">
      <div className="text-center">
        <p className="digits font-display text-8xl font-semibold text-gold-300">404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-paper-50">
          This page didn’t win a spot.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-paper-100/70">
          The address you followed doesn’t exist — but the draws are still on.
        </p>
        <Link
          href="/"
          className="btn-shine mt-8 inline-block rounded-full bg-gold-400 px-8 py-3.5 font-bold text-pine-950 transition hover:bg-gold-300"
        >
          Back to the draws
        </Link>
      </div>
    </main>
  );
}
