'use strict';

/**
 * Public "check my ticket" lookup. Enabled for the Public role by the
 * bootstrap grant of api::ticket.ticket.check. Requires phone + ticketNumber
 * to match; rate-limited in the controller.
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/tickets/check',
      handler: 'api::ticket.ticket.check',
      config: {
        policies: [],
      },
    },
  ],
};
