'use strict';

/**
 * Bootstrap:
 *  1. Grants the Public role exactly the permissions the site needs
 *     (idempotent — safe on every boot). Note: ticket read is deliberately
 *     NEVER granted; tickets hold phone numbers and receipts.
 *  2. If SEED_DEMO=true and no lottery exists yet, seeds a demo campaign
 *     with three draws so the frontend has something to show.
 */

const PUBLIC_ACTIONS = [
  'api::lottery.lottery.find',
  'api::lottery.lottery.findOne',
  'api::draw.draw.find',
  'api::draw.draw.findOne',
  'api::ad.ad.find',
  'api::ad.ad.findOne',
  'api::ticket.ticket.create',
  'api::ticket.ticket.check',
  'api::lottery.lottery.stats',
];

module.exports = {
  register() {},

  async bootstrap({ strapi }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (publicRole) {
      for (const action of PUBLIC_ACTIONS) {
        const existing = await strapi.db
          .query('plugin::users-permissions.permission')
          .findOne({ where: { action, role: publicRole.id } });
        if (!existing) {
          await strapi.db
            .query('plugin::users-permissions.permission')
            .create({ data: { action, role: publicRole.id } });
          strapi.log.info(`Granted Public permission: ${action}`);
        }
      }
    }

    if (process.env.SEED_DEMO === 'true') {
      const count = await strapi.db.query('api::lottery.lottery').count();
      if (count === 0) {
        const lottery = await strapi.documents('api::lottery.lottery').create({
          data: {
            title: 'Grand Prize Lottery — Demo',
            company: 'Demo Trading PLC',
            lotteryStatus: 'open',
            ticketDigits: 6,
            ticketPrice: 100,
            allowMultipleWins: false,
            description:
              'Demo campaign (seeded automatically). One ticket enters you into all three draws.',
            paymentInstructions:
              'Pay 100 ETB to CBE account 1000-1234-5678 (Demo Trading PLC) or Telebirr 0912345678, then register below with your receipt reference number and a screenshot.',
          },
        });

        const draws = [
          { drawNumber: 1, category: 'house', prizeName: '3-Bedroom Condominium, Addis Ababa' },
          { drawNumber: 2, category: 'car', prizeName: 'Toyota Vitz' },
          { drawNumber: 3, category: 'phone', prizeName: 'iPhone 15' },
        ];
        for (const d of draws) {
          await strapi.documents('api::draw.draw').create({
            data: {
              ...d,
              drawStatus: 'scheduled',
              lottery: lottery.documentId,
              drawDate: new Date(Date.now() + (7 + d.drawNumber) * 24 * 60 * 60 * 1000),
            },
          });
        }
        strapi.log.info('Seeded demo lottery with 3 draws (SEED_DEMO=true)');
      }
    }
  },
};
