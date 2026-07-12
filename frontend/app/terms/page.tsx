import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'The rules of Edil prize draws: eligibility, entries, draws, prizes, and claims.',
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. The promoter',
    body: [
      'Edil prize draws are operated by the company named on each campaign page (the “Promoter”). Questions about a campaign, a ticket, or a prize should go to the contact details in the footer.',
    ],
  },
  {
    title: '2. Eligibility',
    body: [
      'Entrants must be 18 years of age or older and resident in Ethiopia. Employees of the Promoter directly involved in running a draw may not enter that draw.',
    ],
  },
  {
    title: '3. Entries and tickets',
    body: [
      'One completed payment equals one ticket. To enter, pay the ticket price using the payment instructions shown on the campaign, then register with your name, phone number, the payment reference number, and a screenshot of the receipt.',
      'Every entry is verified by our team before a ticket number is issued. A ticket is valid only once it shows as Active. Each payment reference can be registered once — duplicate submissions are rejected.',
      'One active ticket is automatically entered into every draw of its campaign. Unless a campaign states otherwise, a ticket that wins one draw is excluded from that campaign’s later draws, giving more players a chance.',
    ],
  },
  {
    title: '4. Rejected entries and refunds',
    body: [
      'Entries whose payment cannot be verified (wrong reference, unreadable receipt, unmatched amount) are rejected. If money was actually received for a rejected entry, contact us with your receipt and we will resolve it — either issuing the ticket or refunding the payment.',
    ],
  },
  {
    title: '5. Draws',
    body: [
      'Draws take place on or after the dates published on the campaign. Winners are selected at random from all active tickets by a cryptographically secure random process. The result is final and recorded.',
      'Winning ticket numbers and the winner’s first name are published on this site immediately after each draw.',
    ],
  },
  {
    title: '6. Prizes and claims',
    body: [
      'Winners are contacted by SMS on the phone number used at registration. To claim, the winner must present the registered phone number and, on request, identification matching the registered name.',
      'Prizes must be claimed within 60 days of the draw. Prizes are as described on the campaign page; no cash alternative is offered unless the Promoter states otherwise. Transfer costs and taxes required by law may apply to the winner as regulated.',
    ],
  },
  {
    title: '7. Responsible play',
    body: [
      'Play for fun, not as income. Set limits and never spend money you need. Entry is restricted to adults 18+.',
    ],
  },
  {
    title: '8. Liability and changes',
    body: [
      'The Promoter is not responsible for entries lost due to incorrect information supplied by the entrant. The Promoter may amend these terms for legal or regulatory reasons; the version published on this page at the time of your entry applies to that entry.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-paper-50">
      <section className="grain bg-pine-950 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">The rules</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-paper-50 sm:text-5xl">
            Terms &amp; Conditions
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
          See also our <Link href="/privacy" className="font-semibold text-gold-600 hover:underline">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}
