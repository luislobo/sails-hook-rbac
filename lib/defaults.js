'use strict';
/**
 *
 * @returns {object} Hook defaults accessible using sails.config.rbac
 *
 * @author Luis Lobo Borobia
 *
 */
module.exports = {
  rbac: {
    rbacRules: [
      {a: 'anonymous'}, {
        a: 'normal',
        can: 'anonymous',
      }, {
        a: 'admin',
        can: 'normal',
      }, {
        a: 'superAdmin',
        can: 'admin',
      }],
    waitFor: [
      'custom',
      'session',
      'orm',
    ],
    helper: {
      path: 'services.RbacHelpers',
    },
    sessionObject: 'me',
    sessionObjectRolePath: 'role',
  },
};
