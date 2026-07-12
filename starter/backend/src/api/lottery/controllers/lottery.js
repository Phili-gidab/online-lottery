'use strict';

/**
 * Public lottery endpoints.
 * - find/findOne never expose campaigns still in "draft"
 * - GET /lotteries/:id/stats returns anonymous counters for the public site
 *   (tickets in play), never any ticket data.
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::lottery.lottery', ({ strapi }) => ({
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      filters: {
        ...(typeof ctx.query.filters === 'object' ? ctx.query.filters : {}),
        lotteryStatus: { $ne: 'draft' },
      },
    };
    return await super.find(ctx);
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    if (response?.data?.lotteryStatus === 'draft') {
      return ctx.notFound('Not found');
    }
    return response;
  },

  async stats(ctx) {
    const { id } = ctx.params;
    const lottery = await strapi.db.query('api::lottery.lottery').findOne({
      where: { documentId: id },
    });
    if (!lottery || lottery.lotteryStatus === 'draft') {
      return ctx.notFound('Not found');
    }
    const activeTickets = await strapi.db.query('api::ticket.ticket').count({
      where: { lottery: { id: lottery.id }, ticketStatus: 'active' },
    });
    const pendingTickets = await strapi.db.query('api::ticket.ticket').count({
      where: { lottery: { id: lottery.id }, ticketStatus: 'pending' },
    });
    ctx.body = { data: { activeTickets, pendingTickets } };
  },
}));
