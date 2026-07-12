import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What personal data Edil collects, why, and how it is protected.',
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What we collect',
    body: [
      'When you register an entry we collect: your first name and father’s name, your phone number, your payment reference number, and the receipt screenshot you upload. That is all — no account, no email, no password.',
    ],
  },
  {
    title: 'Why we collect it',
    body: [
      'Your name and phone number identify your ticket and let us notify you by SMS when your entry is verified and if you win. The payment reference and receipt are used solely to verify that your payment was received before issuing a ticket.',
    ],
  },
  {
    title: 'Receipt screenshots',
    body: [
      'Receipt images are stored on a private disk that is not reachable from the public internet. They are viewed only by the verification team, only to confirm your payment.',
    ],
  },
  {
    title: 'What we publish',
    body: [
      'When a ticket wins a draw, we publish the winning ticket number, the winner’s first name and the initial of the father’s name (for example “Sara T.”). We never publish phone numbers, full names, or receipts.',
    ],
  },
  {
    title: 'Sharing',
    body: [
      'We do not sell or share your data with third parties, except: our SMS delivery provider (to send you your ticket number and win notifications), and authorities where disclosure is required by Ethiopian law or lottery regulation.',
    ],
  },
  {
    title: 'Retention and your rights',
    body: [
      'Entry records are kept for the duration of the campaign and any legally required record-keeping period, then deleted. You may ask us to correct your name or phone number, or to delete a rejected entry’s data, using the contact details in the footer.',
    ],
  },
  {
    title: 'On your device',
    body: [
      'The “My tickets” panel stores your own entries in your browser’s local storage, on your device only. Clearing your browser data removes it; we keep no copy of that list.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper-50">
      <section className="grain bg-pine-950 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">Your data</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-paper-50 sm:text-5xl">
            Privacy Policy
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-2xl font-semibold text-pine-900">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-ink-600">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-paper-200 pt-6 text-sm text-ink-400">
          See also our <Link href="/terms" className="font-semibold text-gold-600 hover:underline">Terms &amp; Conditions</Link>.
        </p>
      </section>
    </main>
  );
}
