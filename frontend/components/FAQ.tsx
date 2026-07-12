import Reveal from '@/components/Reveal';

const QA = [
  {
    q: 'How does one ticket enter every draw?',
    a: 'Each campaign has several draws — first, second, third, up to five. Your ticket number goes into the pool once and stays eligible for every draw. If it wins one, it steps aside so another ticket wins the next.',
  },
  {
    q: 'How do I pay if there is no online payment?',
    a: 'You pay the operator directly — Telebirr or bank transfer — using the account details on the entry page. Then you register here with your receipt reference number and a screenshot. A human verifies every payment before a ticket is issued.',
  },
  {
    q: 'When do I get my ticket number?',
    a: 'As soon as your payment is verified — usually within a few hours. You’ll receive your unique 6-digit number by SMS, and you can confirm it anytime in the "Check my ticket" section.',
  },
  {
    q: 'How do I know the draw is fair?',
    a: 'Winners are selected by a cryptographically secure random number generator, each draw runs exactly once, and results are published immediately with the winning ticket number. Draws are logged and auditable end-to-end.',
  },
  {
    q: 'What happens if I win?',
    a: 'Your ticket number is published, and we contact you directly on your registered phone number with the claim process. Prizes are handed over with full documentation.',
  },
  {
    q: 'Who can play?',
    a: 'Players must be 18 or older with a valid Ethiopian phone number. Play responsibly — set your own limits, and never play with money you need.',
  },
];

export default function FAQ() {
  return (
    <section className="bg-paper-50 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-gold-600">
            Questions
          </p>
          <h2 className="mt-3 text-center font-display text-4xl font-semibold text-pine-900">
            Everything else you’d ask.
          </h2>
        </Reveal>

        <div className="mt-10 space-y-3">
          {QA.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <details className="faq group rounded-xl border border-paper-200 bg-white px-6 py-4 open:pb-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-pine-900">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
