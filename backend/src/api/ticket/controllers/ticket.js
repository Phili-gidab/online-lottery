'use strict';

/**
 * Public ticket endpoints.
 *
 * POST /api/tickets        — registration (multipart: data + files.receiptScreenshot)
 * POST /api/tickets/check  — "check my ticket": phone + ticketNumber → status
 *
 * Strapi 5 removed upload-at-entry-creation, so create() attaches the receipt
 * via the upload service itself — /api/upload stays closed to the public.
 * ticketStatus / ticketNumber / source are always forced server-side.
 */

const { createCoreController } = require('@strapi/strapi').factories;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const PHONE_RE = /^(\+251[79]\d{8}|0[79]\d{8})$/;

const WINDOW_MS = 60_000;
const LIMITS = { register: 5, check: 12 };
const hits = new Map();

function rateLimited(bucket, ip) {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const stamps = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (stamps.length >= LIMITS[bucket]) {
    hits.set(key, stamps);
    return true;
  }
  stamps.push(now);
  hits.set(key, stamps);
  if (hits.size > 20_000) hits.clear();
  return false;
}

function clip(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

module.exports = createCoreController('api::ticket.ticket', ({ strapi }) => ({
  async create(ctx) {
    if (rateLimited('register', ctx.request.ip)) {
      return ctx.throw(429, 'Too many registrations from this address — try again in a minute');
    }

    let data = ctx.request.body?.data ?? {};
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return ctx.badRequest('Invalid data payload');
      }
    }

    const firstName = clip(data.firstName, 80);
    const fatherName = clip(data.fatherName, 80);
    const phone = clip(data.phone, 20);
    const paymentRef = clip(data.paymentRef, 64);
    const lottery = data.lottery;

    if (!firstName || !fatherName) {
      return ctx.badRequest('First name and father’s name are required');
    }
    if (!PHONE_RE.test(phone)) {
      return ctx.badRequest('Please provide a valid Ethiopian phone number (e.g. 0912345678)');
    }
    if (!paymentRef) {
      return ctx.badRequest('The payment reference number is required');
    }
    if (typeof lottery !== 'string' || !lottery) {
      return ctx.badRequest('lottery (documentId) is required');
    }

    const lotteryDoc = await strapi
      .documents('api::lottery.lottery')
      .findOne({ documentId: lottery });
    if (!lotteryDoc) {
      return ctx.badRequest('Unknown lottery');
    }
    if (lotteryDoc.lotteryStatus !== 'open') {
      return ctx.badRequest('This lottery is not accepting registrations');
    }

    const filesBag = ctx.request.files || {};
    let file = filesBag['files.receiptScreenshot'] ?? filesBag.receiptScreenshot;
    if (Array.isArray(file)) file = file[0];
    if (!file) {
      return ctx.badRequest('The receipt screenshot is required');
    }
    const mime = file.mimetype || file.type || '';
    if (!ALLOWED_MIME.includes(mime)) {
      return ctx.badRequest('The receipt must be a photo or screenshot (JPEG/PNG/WebP)');
    }
    if ((file.size ?? 0) > MAX_FILE_BYTES) {
      return ctx.badRequest('The receipt image is too large — maximum 5 MB');
    }

    const doc = await strapi.documents('api::ticket.ticket').create({
      data: {
        firstName,
        fatherName,
        phone,
        paymentRef,
        lottery: lotteryDoc.documentId,
        ticketStatus: 'pending',
        source: 'web',
      },
    });

    const row = await strapi.db.query('api::ticket.ticket').findOne({
      where: { documentId: doc.documentId },
    });

    try {
      await strapi.plugin('upload').service('upload').upload({
        data: {
          ref: 'api::ticket.ticket',
          refId: row.id,
          field: 'receiptScreenshot',
        },
        files: file,
      });
    } catch (err) {
      strapi.log.error('Receipt upload failed — rolling back ticket', err);
      await strapi
        .documents('api::ticket.ticket')
        .delete({ documentId: doc.documentId })
        .catch(() => {});
      return ctx.throw(500, 'Could not store the receipt — please try again');
    }

    // Deliberately minimal response: no PII echo.
    ctx.body = { data: { documentId: doc.documentId, ticketStatus: 'pending' } };
  },

  /**
   * Check a ticket's status. Requires BOTH the phone number and the ticket
   * number to match, so ticket numbers alone cannot be enumerated, and the
   * response never includes other people's data.
   */
  async check(ctx) {
    if (rateLimited('check', ctx.request.ip)) {
      return ctx.throw(429, 'Too many lookups — try again in a minute');
    }

    const body = ctx.request.body || {};
    const phone = clip(body.phone, 20);
    const ticketNumber = clip(body.ticketNumber, 12);

    if (!PHONE_RE.test(phone) || !/^\d{4,10}$/.test(ticketNumber)) {
      return ctx.badRequest('Enter the phone number and ticket number used at registration');
    }

    const ticket = await strapi.db.query('api::ticket.ticket').findOne({
      where: { phone, ticketNumber },
      populate: { lottery: true, wonDraws: true },
    });

    if (!ticket) {
      ctx.body = { data: { found: false } };
      return;
    }

    ctx.body = {
      data: {
        found: true,
        ticketNumber: ticket.ticketNumber,
        ticketStatus: ticket.ticketStatus,
        lottery: ticket.lottery?.title ?? null,
        wins: (ticket.wonDraws || []).map((d) => ({
          drawNumber: d.drawNumber,
          prizeName: d.prizeName,
          category: d.category,
        })),
      },
    };
  },
}));
