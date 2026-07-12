'use strict';

/**
 * Custom route: execute a draw.
 * Auth is NOT disabled — call it with an API token that has the
 * draw.execute permission (Settings → API Tokens). See README.
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/draws/:id/execute',
      handler: 'api::draw.draw.execute',
      config: {
        policies: [],
      },
    },
  ],
};
