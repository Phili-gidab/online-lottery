'use client';

import { useEffect, useRef, useState, FormEvent, ChangeEvent, DragEvent } from 'react';
import { apiUrl, checkNumberAvailability, saveEntry } from '@/lib/api';
import ConfettiBurst from '@/components/fx/ConfettiBurst';

interface Props {
  lotteryDocumentId: string;
  lotteryTitle: string;
  ticketPrice?: number | null;
  ticketDigits?: number;
}

const MAX_FILE_MB = 5;
const PHONE_RE = /^(\+251[79]\d{8}|0[79]\d{8})$/;

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Avail = 'idle' | 'checking' | 'free' | 'taken' | 'short';

export default function RegistrationForm({
  lotteryDocumentId,
  lotteryTitle,
  ticketPrice,
  ticketDigits = 6,
}: Props) {
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [lucky, setLucky] = useState('');
  const [avail, setAvail] = useState<Avail>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pendingNumber, setPendingNumber] = useState<string | null>(null);
  const luckyRef = useRef('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // Debounced live availability for the chosen number.
  useEffect(() => {
    luckyRef.current = lucky;
    if (lucky === '') {
      setAvail('idle');
      setSuggestions([]);
      return;
    }
    if (lucky.length < ticketDigits) {
      setAvail('short');
      setSuggestions([]);
      return;
    }
    setAvail('checking');
    const wanted = lucky;
    const timer = setTimeout(async () => {
      const result = await checkNumberAvailability(lotteryDocumentId, wanted);
      if (luckyRef.current !== wanted) return; // stale response
      if (!result) {
        setAvail('idle'); // offline — the server re-validates on submit anyway
        return;
      }
      setAvail(result.available ? 'free' : 'taken');
      setSuggestions(result.available ? [] : result.suggestions);
    }, 450);
    return () => clearTimeout(timer);
  }, [lucky, ticketDigits, lotteryDocumentId]);

  function acceptFile(file: File | null) {
    setError(null);
    if (!file) {
      setReceipt(null);
      setPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('The receipt must be an image (photo or screenshot).');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`The image is too large — maximum ${MAX_FILE_MB} MB.`);
      return;
    }
    setReceipt(file);
    setPreview(URL.createObjectURL(file));
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    acceptFile(e.target.files?.[0] ?? null);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !fatherName.trim()) {
      setError('Please enter your name and your father’s name.');
      return;
    }
    if (!PHONE_RE.test(phone.trim())) {
      setError('Please enter a valid Ethiopian phone number, e.g. 0912345678.');
      return;
    }
    if (!paymentRef.trim()) {
      setError('Please enter the reference number from your payment receipt.');
      return;
    }
    if (lucky !== '' && lucky.length !== ticketDigits) {
      setError(`Your chosen number must be exactly ${ticketDigits} digits — or clear the field for a random one.`);
      return;
    }
    if (lucky !== '' && avail === 'taken') {
      setError(`Nº ${lucky} is already taken — pick another number or clear the field.`);
      return;
    }
    if (!receipt) {
      setError('Please attach a screenshot or photo of your payment receipt.');
      return;
    }

    setStatus('submitting');
    try {
      const fd = new FormData();
      fd.append('firstName', firstName.trim());
      fd.append('fatherName', fatherName.trim());
      fd.append('phone', phone.trim());
      fd.append('paymentRef', paymentRef.trim());
      fd.append('lottery', lotteryDocumentId);
      if (lucky !== '') fd.append('ticketNumber', lucky);
      fd.append('receipt', receipt);

      const res = await fetch(`${apiUrl()}/api/tickets`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          body?.error?.message ?? body?.message ?? `Submission failed (${res.status})`
        );
      }

      setPendingNumber(body?.data?.ticketNumber ?? null);

      // Remember this entry on the device for the "My tickets" tracker.
      if (body?.data?.documentId) {
        saveEntry({
          id: String(body.data.documentId),
          phone: phone.trim(),
          name: firstName.trim(),
          lottery: lotteryTitle,
          at: Date.now(),
        });
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.');
    }
  }

  /* ---------- success: a pending golden stub ---------- */
  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gold-300 via-gold-200 to-gold-400 p-[2px]">
        <div className="relative overflow-hidden rounded-[14px] bg-pine-950 p-8 text-center">
          <ConfettiBurst />
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-400">
            Entry received · {lotteryTitle}
          </p>
          <p className="digits mt-4 font-display text-4xl font-semibold text-paper-50">
            Nº {pendingNumber ?? '······'}
          </p>
          <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-gold-300">
            {pendingNumber ? 'Your number — pending verification' : 'Pending verification'}
          </p>
          <div className="mx-auto my-6 h-0 w-3/4 border-t-2 border-dashed border-paper-50/20" />
          <p className="text-sm leading-relaxed text-paper-100/75">
            Thank you, {firstName}.{' '}
            {pendingNumber
              ? <>Once our team verifies your payment, Nº {pendingNumber} is locked in and confirmed by SMS to{' '}</>
              : <>Once our team verifies your payment, your ticket number will be issued and sent to{' '}</>}
            <strong className="text-paper-50">{phone}</strong>. You can check
            your status anytime with “Check my ticket”.
          </p>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-paper-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder-ink-400/50 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20';
  const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-ink-600';

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelCls}>
            First name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Abebe"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label htmlFor="fatherName" className={labelCls}>
            Father’s name
          </label>
          <input
            id="fatherName"
            type="text"
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            placeholder="Kebede"
            className={inputCls}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={labelCls}>
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0912345678"
          className={inputCls}
          required
        />
        <p className="mt-1 text-xs text-ink-400">
          Your ticket number will be sent to this number by SMS.
        </p>
      </div>

      <div>
        <label htmlFor="lucky" className={labelCls}>
          Lucky number <span className="font-medium normal-case tracking-normal text-ink-400">(optional)</span>
        </label>
        <input
          id="lucky"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={ticketDigits}
          value={lucky}
          onChange={(e) => setLucky(e.target.value.replace(/\D/g, '').slice(0, ticketDigits))}
          placeholder={`Pick your own ${ticketDigits}-digit number`}
          className={`digits ${inputCls} ${
            avail === 'free'
              ? 'border-pine-600 ring-2 ring-pine-600/15'
              : avail === 'taken'
                ? 'border-clay-600 ring-2 ring-clay-600/15'
                : ''
          }`}
        />
        {avail === 'idle' && (
          <p className="mt-1 text-xs text-ink-400">
            Leave empty and we&apos;ll draw a random number for you.
          </p>
        )}
        {avail === 'short' && (
          <p className="mt-1 text-xs text-ink-400">
            {ticketDigits - lucky.length} more digit{ticketDigits - lucky.length === 1 ? '' : 's'}…
          </p>
        )}
        {avail === 'checking' && (
          <p className="mt-1 text-xs text-ink-400">Checking Nº {lucky}…</p>
        )}
        {avail === 'free' && (
          <p className="mt-1 text-xs font-semibold text-pine-700">
            ✓ Nº {lucky} is free — it&apos;s yours once your payment is verified.
          </p>
        )}
        {avail === 'taken' && (
          <div className="mt-1 text-xs">
            <span className="font-semibold text-clay-600">✗ Nº {lucky} is taken.</span>
            {suggestions.length > 0 && (
              <span className="text-ink-400">
                {' '}Free:{' '}
                {suggestions.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLucky(s)}
                    className="digits font-bold text-gold-600 hover:underline"
                  >
                    {s}
                    {i < suggestions.length - 1 ? ', ' : ''}
                  </button>
                ))}
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="paymentRef" className={labelCls}>
          Payment reference number
        </label>
        <input
          id="paymentRef"
          type="text"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          placeholder="e.g. FT26123ABC456"
          className={inputCls}
          required
        />
        <p className="mt-1 text-xs text-ink-400">
          The transaction/reference number printed on your bank or Telebirr receipt.
        </p>
      </div>

      <div>
        <span className={labelCls}>Receipt screenshot</span>
        <label
          htmlFor="receipt"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
            dragOver
              ? 'border-gold-500 bg-gold-200/30'
              : 'border-paper-300 bg-paper-100/60 hover:border-gold-500'
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-56 rounded-lg object-contain"
            />
          ) : (
            <>
              <span className="text-3xl">🧾</span>
              <span className="mt-2 text-sm font-semibold text-ink-900">
                Drop your receipt here, or tap to choose
              </span>
              <span className="mt-1 text-xs text-ink-400">
                JPEG / PNG / WebP · max {MAX_FILE_MB} MB
              </span>
            </>
          )}
          <input
            id="receipt"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="sr-only"
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={() => acceptFile(null)}
            className="mt-2 text-xs font-semibold text-clay-600 hover:underline"
          >
            Remove image
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-clay-600/30 bg-clay-600/10 px-3.5 py-2.5 text-sm font-medium text-clay-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn-shine w-full rounded-full bg-gold-400 px-6 py-4 text-base font-bold text-pine-950 transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting'
          ? 'Submitting…'
          : `Submit my entry${ticketPrice ? ` — ${ticketPrice.toLocaleString()} ETB paid` : ''}`}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-400">
        Your ticket becomes active after our team verifies your payment. One
        entry is one ticket, valid across all draws of this lottery. 18+ only.
      </p>
    </form>
  );
}
