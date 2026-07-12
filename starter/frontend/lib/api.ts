/**
 * API client for the Laravel backend. In production the static site and the
 * API share one domain, so the base URL is '' (same-origin). For local dev
 * set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface Media {
  url: string;
}

export interface Draw {
  id: number;
  documentId: string;
  drawNumber: number;
  title?: string | null;
  category: 'house' | 'car' | 'phone' | 'cash' | 'other';
  prizeName: string;
  prizeImage?: Media | null;
  drawDate?: string | null;
  drawStatus: 'scheduled' | 'drawn';
  winnerTicketNumber?: string | null;
  winnerDisplayName?: string | null;
  drawnAt?: string | null;
}

export interface Lottery {
  id: number;
  documentId: string;
  title: string;
  company: string;
  description?: string | null;
  lotteryStatus: string;
  ticketPrice?: number | null;
  ticketDigits: number;
  maxTickets?: number | null;
  paymentInstructions?: string | null;
  draws: Draw[];
}

export interface Ad {
  id: number;
  documentId: string;
  sponsorName?: string | null;
  linkUrl?: string | null;
  image?: Media | null;
}

export interface LotteryStats {
  activeTickets: number;
  pendingTickets: number;
  maxTickets?: number | null;
  soldOut?: boolean;
}

export interface TicketCheckResult {
  found: boolean;
  ticketNumber?: string;
  ticketStatus?: 'pending' | 'active' | 'rejected';
  lottery?: string | null;
  wins?: { drawNumber: number; prizeName: string; category: string }[];
}

export function apiUrl(): string {
  return API_URL;
}

/** Media URLs from the API are relative (/storage/...); make them absolute. */
export function mediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

function sortDraws(lottery: Lottery): Lottery {
  lottery.draws = (lottery.draws ?? []).sort((a, b) => a.drawNumber - b.drawNumber);
  return lottery;
}

/** All public (non-draft) lotteries, newest first. */
export async function getAllLotteries(): Promise<Lottery[]> {
  const res = await fetch(`${API_URL}/api/lotteries`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).map(sortDraws);
}

export async function getOpenLotteries(): Promise<Lottery[]> {
  return (await getAllLotteries()).filter((l) => l.lotteryStatus === 'open');
}

export async function getLottery(documentId: string): Promise<Lottery | null> {
  const res = await fetch(`${API_URL}/api/lotteries/${documentId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ? sortDraws(json.data) : null;
}

export async function getStats(documentId: string): Promise<LotteryStats | null> {
  try {
    const res = await fetch(`${API_URL}/api/lotteries/${documentId}/stats`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function getAds(): Promise<Ad[]> {
  // Ads ship with the lotteries payload? No — separate endpoint keeps it simple.
  try {
    const res = await fetch(`${API_URL}/api/ads`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

export const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  house: { icon: '🏠', label: 'House' },
  car: { icon: '🚗', label: 'Car' },
  phone: { icon: '📱', label: 'Phone' },
  cash: { icon: '💵', label: 'Cash' },
  other: { icon: '🎁', label: 'Prize' },
};

/** Local demo photos of the flagship house prize (frontend/public). */
export const HOUSE_PHOTOS = {
  heroPortrait: '/photo_4_2026-07-11_23-07-32.jpg',
  wide: '/photo_1_2026-07-11_23-07-32.jpg',
  portraitAlt: '/photo_8_2026-07-11_23-07-32.jpg',
  yard: '/photo_6_2026-07-11_23-07-32.jpg',
};

/** Prize image for a draw: API media first, local demo fallbacks after.
 *  (Fallback photo credits: /prize-image-credits.txt) */
export function prizeImageUrl(draw: Draw): string | undefined {
  const fromApi = mediaUrl(draw.prizeImage?.url);
  if (fromApi) return fromApi;
  if (draw.category === 'house') return HOUSE_PHOTOS.portraitAlt;
  if (draw.category === 'car') return '/prize-vitz.jpg';
  if (draw.category === 'phone') return '/prize-iphone.jpg';
  return undefined;
}

/** The next upcoming scheduled draw of a lottery (for the countdown). */
export function nextScheduledDraw(lottery: Lottery): Draw | null {
  const upcoming = lottery.draws
    .filter((d) => d.drawStatus === 'scheduled' && d.drawDate)
    .sort((a, b) => new Date(a.drawDate!).getTime() - new Date(b.drawDate!).getTime());
  return upcoming[0] ?? null;
}

/** Format a date compactly, e.g. "21 July 2026". */
export function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ---------- "My tickets" — entries saved on this device ---------- */

export interface SavedEntry {
  id: string; // ticket documentId
  phone: string;
  name: string;
  lottery: string;
  at: number;
}

export interface EntryStatus {
  documentId: string;
  ticketStatus: 'pending' | 'active' | 'rejected';
  ticketNumber?: string | null;
  lottery?: string | null;
  wins: { drawNumber: number; prizeName: string }[];
}

const ENTRIES_KEY = 'edil.entries';
export const ENTRIES_EVENT = 'edil:entries-changed';

export function getSavedEntries(): SavedEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(ENTRIES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveEntry(entry: SavedEntry): void {
  const entries = [entry, ...getSavedEntries()].slice(0, 20);
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(ENTRIES_EVENT));
}

export function removeEntry(id: string): void {
  const entries = getSavedEntries().filter((e) => e.id !== id);
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(ENTRIES_EVENT));
}

/** Live statuses for saved entries (grouped per phone, privacy-checked server-side). */
export async function getEntryStatuses(entries: SavedEntry[]): Promise<EntryStatus[]> {
  const byPhone = new Map<string, SavedEntry[]>();
  for (const e of entries) {
    byPhone.set(e.phone, [...(byPhone.get(e.phone) ?? []), e]);
  }
  const out: EntryStatus[] = [];
  for (const [phone, group] of byPhone) {
    try {
      const res = await fetch(`${API_URL}/api/tickets/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone, ids: group.map((e) => Number(e.id)) }),
      });
      if (!res.ok) continue;
      const json = await res.json();
      out.push(...(json.data ?? []));
    } catch {
      /* offline — panel shows cached info */
    }
  }
  return out;
}
