'use strict';

/**
 * Draw execution.
 *
 * POST /api/draws/:documentId/execute  (requires an API token — see README)
 *
 * Picks a uniformly random winner (crypto-secure RNG) from this lottery's
 * ACTIVE tickets. One entry is a single ticket eligible across all of the
 * lottery's draws; by default a ticket that has already won one draw is
 * excluded from later draws (set lottery.allowMultipleWins to change that).
 *
 * Concurrency: execution "claims" the draw with an atomic conditional update
 * (drawStatus scheduled → drawn), so two simultaneous calls cannot both pick
 * a winner. Winner name + ticket number are denormalized onto the Draw so the
 * public site never needs read access to tickets (which hold phone numbers).
 */

const crypto = require('crypto');
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::draw.draw', ({ strapi }) => ({
  async execute(ctx) {
    const { id } = ctx.params;

    const draw = await strapi.db.query('api::draw.draw').findOne({
      where: { documentId: id },
      populate: { lottery: true },
    });
    if (!draw) return ctx.notFound('Draw not found');
    if (!draw.lottery) return ctx.badRequest('Draw has no lottery attached');
    if (draw.drawStatus === 'drawn') {
      return ctx.badRequest('This draw has already been executed');
    }

    // Atomic claim — loses the race cleanly if another call got here first.
    const claimed = await strapi.db.query('api::draw.draw').update({
      where: { id: draw.id, drawStatus: 'scheduled' },
      data: { drawStatus: 'drawn', drawnAt: new Date() },
    });
    if (!claimed) {
      return ctx.badRequest('This draw has already been executed');
    }

    let tickets = await strapi.db.query('api::ticket.ticket').findMany({
      where: {
        lottery: { id: draw.lottery.id },
        ticketStatus: 'active',
        ticketNumber: { $notNull: true },
      },
      populate: { wonDraws: true },
    });
    tickets = tickets.filter((t) => t.ticketNumber);
    if (!draw.lottery.allowMultipleWins) {
      tickets = tickets.filter((t) => !(t.wonDraws && t.wonDraws.length > 0));
    }

    if (tickets.length === 0) {
      // Release the claim so the draw can be run once tickets exist.
      await strapi.db.query('api::draw.draw').update({
        where: { id: draw.id },
        data: { drawStatus: 'scheduled', drawnAt: null },
      });
      return ctx.badRequest('No eligible active tickets for this draw');
    }

    const winner = tickets[crypto.randomInt(0, tickets.length)];
    const winnerDisplayName =
      `${winner.firstName} ${(winner.fatherName || '').charAt(0)}${winner.fatherName ? '.' : ''}`.trim();

    await strapi.db.query('api::draw.draw').update({
      where: { id: draw.id },
      data: {
        winningTicket: winner.id,
        winnerTicketNumber: winner.ticketNumber,
        winnerDisplayName,
      },
    });

    strapi.log.info(
      `Draw ${draw.documentId} (#${draw.drawNumber}) executed: winner ticket ${winner.ticketNumber} out of ${tickets.length} eligible`
    );

    ctx.body = {
      draw: draw.title || `Draw #${draw.drawNumber}`,
      eligibleTickets: tickets.length,
      winnerTicketNumber: winner.ticketNumber,
      winnerDisplayName,
    };
  },
}));
