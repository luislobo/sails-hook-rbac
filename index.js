'use strict';
const debug = require('debug')('sails-hook-rbac:index');
const RBAC = require('@luislobo/rbac2');
const {get} = require('lodash');
const flaverr = require('flaverr');

const defaults = require('./lib/defaults');
const initialize = require('./lib/initialize');

const getRbacRulesAndBeforeRoutes = require(
    './lib/getRbacRulesAndBeforeRoutes');

/**
 * Sails Hook RBAC2
 *
 * @param {object} sails - Sails object
 */
module.exports = function(sails) {

  let rbacInstance;

  const {rbacRules, before} = getRbacRulesAndBeforeRoutes(sails);

  return {
    defaults,

    configure: function() {
      const hookConfig = sails.config[this.configKey];
      // augment rules using the configuration in the hook as well as
      // the ones that come from the routes
      hookConfig.rbacRules = [
        ...hookConfig.rbacRules,
        ...rbacRules];
      console.log(sails.config[this.configKey]);
    },

    initialize: (next) => {

      sails.log.info('Initializing rbac hook...');

      // Configure RBAC, check full path, cache trees
      rbacInstance = new RBAC(
          [...sails.config.rbac.rbacRules, ...rbacRules],
          true,
          true);

      initialize(sails.hooks.rbac, sails, next);
    },

    routes: {
      before,
    },

    rbacCheck(can, req, res, next) {
      debug('rbacCheck', can);

      const hookConfig = sails.config[this.configKey];

      // Do we have a session object?
      if (req[hookConfig.sessionObject]) {

        // Set params for when
        const whenParams = req.allParams();
        whenParams[hookConfig.sessionObject] = req[hookConfig.sessionObject];
        whenParams.body = req.body;
        whenParams.req = req;

        const role = get(req[hookConfig.sessionObject],
            hookConfig.sessionObjectRolePath, 'role');

        debug('rbacCheck:check', role, can,
            req.method.toUpperCase(), req.route.path, whenParams);

        rbacInstance.check(role, can, whenParams, (err, result) => {
          if (err) {
            debug('rbacCheck:err', 'evalAccess Error', err);
            return next(flaverr('RBAC_ERROR', err));
          } else if (result) {
            debug('rbacCheck:passed');
            return next(null, result);
          }
          debug('rbacCheck:resultEmpty', result);
          return next(flaverr(403,
              new Error('Forbidden')));
        });
      } else {
        debug('rbacCheck:noSessionObject');
        return next(flaverr('RBAC_NO_SESSION', new Error('No session object')));
      }
    },
  };
};
