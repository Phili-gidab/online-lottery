'use strict';

/**
 * Ticket number invariants.
 *
 * - Activating a ticket (ticketStatus → "active") assigns a unique random
 *   number of exactly `lottery.ticketDigits` digits (zero-padded), unless the
 *   admin typed one manually — manual numbers are validated for exact length
 *   and uniqueness. Numbers are globally unique across campaigns (enforced by
 *   a DB unique constraint as the last line of defense against races).
 * - An assigned number can never be blanked.
 * - Works for both flows: create-then-approve (web entries) and direct
 *   creation as "active" (admin registering WhatsApp entries in one step).
 */

const crypto = require('crypto');
const { ApplicationError } = require('@strapi/utils').errors;

const MAX_ATTEMPTS = 50;
const DEFAULT_DIGITS = 6;

async function generateUniqueNumber(strapi, digits) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = String(crypto.randomInt(0, 10 ** digits)).padStart(digits, '0');
    const clash = await strapi.db.query('api::ticket.ticket').findOne({
      where: { ticketNumber: candidate },
    });
    if (!clash) return candidate;
  }
  throw new ApplicationError(
    'Could not generate a unique ticket number — the number pool is nearly full'
  );
}

async function assertManualNumberValid(strapi, { number, digits, selfId }) {
  if (!new RegExp(`^\\d{${digits}}$`).test(String(number))) {
    throw new ApplicationError(`Ticket number must be exactly ${digits} digits`);
  }
  const clash = await strapi.db.query('api::ticket.ticket').findOne({
    where: {
      ticketNumber: String(number),
      ...(selfId ? { id: { $ne: selfId } } : {}),
    },
  });
  if (clash) {
    throw new ApplicationError(`Ticket number ${number} is already taken`);
  }
}

/**
 * Best-effort extraction of the lottery's numeric id from the many shapes a
 * relation can take in a db-layer create payload.
 */
async function resolveLotteryDigits(strapi, rel) {
  let id = null;
  let documentId = null;

  const pick = (v) => {
    if (v == null) return;
    if (typeof v === 'number') id = v;
    else if (typeof v === 'string') documentId = v;
    else if (typeof v === 'object') {
      if (typeof v.id === 'number') id = v.id;
      else if (typeof v.documentId === 'string') documentId = v.documentId;
    }
  };

  if (rel && typeof rel === 'object' && !Array.isArray(rel)) {
    if (Array.isArray(rel.connect)) rel.connect.forEach(pick);
    else if (Array.isArray(rel.set)) rel.set.forEach(pick);
    else pick(rel);
  } else if (Array.isArray(rel)) {
    rel.forEach(pick);
  } else {
    pick(rel);
  }

  const where = id ? { id } : documentId ? { documentId } : null;
  if (!where) return null;
  const lottery = await strapi.db.query('api::lottery.lottery').findOne({ where });
  return lottery ? lottery.ticketDigits || DEFAULT_DIGITS : null;
}

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    const activating = data.ticketStatus === 'active';
    const hasNumber = !!data.ticketNumber;
    if (!activating && !hasNumber) return;

    const digits = (await resolveLotteryDigits(strapi, data.lottery)) ?? DEFAULT_DIGITS;

    if (hasNumber) {
      await assertManualNumberValid(strapi, { number: data.ticketNumber, digits, selfId: null });
      data.ticketNumber = String(data.ticketNumber);
    } else if (activating) {
      data.ticketNumber = await generateUniqueNumber(strapi, digits);
    }
    if (activating && !data.approvedAt) {
      data.approvedAt = new Date();
    }
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    const touchesNumber = 'ticketNumber' in data;
    const activating = data.ticketStatus === 'active';
    if (!touchesNumber && !activating) return;

    const existing = await strapi.db.query('api::ticket.ticket').findOne({
      where,
      populate: { lottery: true },
    });
    if (!existing) return;

    const lottery = existing.lottery;
    const digits = lottery?.ticketDigits || DEFAULT_DIGITS;

    // An assigned number can never be blanked ('' or null).
    if (touchesNumber && !data.ticketNumber && existing.ticketNumber) {
      delete data.ticketNumber;
    }

    // Any manual number (new or changed) is validated, whatever the status.
    if (data.ticketNumber) {
      await assertManualNumberValid(strapi, {
        number: data.ticketNumber,
        digits,
        selfId: existing.id,
      });
      data.ticketNumber = String(data.ticketNumber);
    }

    if (activating) {
      if (!lottery) {
        throw new ApplicationError('Cannot activate a ticket that has no lottery attached');
      }
      const effectiveNumber = data.ticketNumber ?? existing.ticketNumber;
      if (!effectiveNumber) {
        data.ticketNumber = await generateUniqueNumber(strapi, digits);
      } else if (!data.ticketNumber && existing.ticketStatus !== 'active') {
        // A number stored while pending goes active now — validate it.
        await assertManualNumberValid(strapi, {
          number: existing.ticketNumber,
          digits,
          selfId: existing.id,
        });
      }
      if (existing.ticketStatus !== 'active' && !data.approvedAt) {
        data.approvedAt = new Date();
      }
    }
  },
};
