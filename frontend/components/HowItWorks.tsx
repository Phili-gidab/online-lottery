import Reveal from '@/components/Reveal';

const STEPS = [
  {
    n: 1,
    title: 'Pay for your ticket',
    body: 'Send the ticket price by Telebirr or bank transfer to the account shown on the entry page. Keep your receipt — you’ll need its reference number.',
  },
  {
    n: 2,
    title: 'Register with your receipt',
    body: 'Fill the entry form with your name, phone, the receipt reference number, and a screenshot of the receipt. Registration takes under a minute.',
  },
  {
    n: 3,
    title: 'Get your number. Watch every draw.',
    body: 'Once our team verifies the payment, your 6-digit ticket number is issued by SMS. That one ticket is entered into every draw of the campaign.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-paper-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-pine-900 sm:text-5xl">
            Three steps between you <br className="hidden sm:block" />
            and the draw.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative h-full rounded-2xl border border-paper-200 bg-white p-7 pt-9">
                <span className="absolute -top-5 left-7 flex h-10 w-10 items-center justify-center rounded-full bg-pine-900 font-display text-lg font-semibold text-gold-300 shadow-lg">
                  {s.n}
                </span>
                <h3 className="font-display text-xl font-semibold text-pine-900">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-600">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-8 text-sm text-ink-400">
            No online payment is taken on this site — payments go directly to
            the operator’s account, and every entry is verified by a human
            before a ticket number is issued.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
