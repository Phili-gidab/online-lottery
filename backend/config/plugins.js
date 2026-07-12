'use strict';

/**
 * Upload hardening: cap file size at 5 MB (matches the frontend's client-side
 * limit). Mime-type validation happens in the ticket create controller — the
 * standalone POST /api/upload endpoint is never granted to the Public role.
 */

module.exports = () => ({
  upload: {
    config: {
      sizeLimit: 5 * 1024 * 1024,
    },
  },
});
