'use strict';

/**
 * Public anonymous stats for a lottery (ticket counters only, no PII).
 * Enabled for the Public role by the bootstrap grant of
 * api::lottery.lottery.stats.
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/lotteries/:id/stats',
      handler: 'api::lottery.lottery.stats',
      config: {
        policies: [],
      },
    },
  ],
};
