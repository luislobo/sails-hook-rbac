const debug = require('debug')('sails-hook-rbac:get-rbac-and-before-rules');
const {each} = require('lodash');

const {getCan} = require('./helper');

/**
 * Creates rules for RBAC2 module, based on routes RBAC configuration.
 * Sets "can" based on controller.action names or route path,
 * if not manually set
 * Also configures before routes for the hook
 * @param sails
 * @returns {{before: {}, rbacRules: []}}
 * before routes and rules to be used in RBAC2 module
 */
module.exports = function getRbacRulesAndBeforeRoutes(sails) {

  const before = {};
  const rbacRules = [];
  each(sails.config.routes, (routeConfig, routePath) => {
    if (routeConfig.rbac) {
      each(routeConfig.rbac, (rule, role) => {
        // configure rules
        // ===============
        rule.a = role; // eslint-disable-line id-length
        // if the user didn't specify a "can", infer it.
        if (!rule.can) {
          rule.can = getCan(routeConfig, routePath);
        }
        rbacRules.push(rule);

        // configure before
        // ================
        // allows rule to change the route for this rule
        if (rule.route) {
          routePath = rule.route;
        }
        before[routePath] = function(req, res, next) {
          debug('rbac', routePath, rule.can);
          sails.hooks.rbac.rbacCheck(rule.can, req, res, (err, result) => {
            if (err) {
              return next(err);
            }
            return next(null, result);
          });
        };
      });
    } else {
      debug('Route %s has no RBAC setting', routePath);
      sails.log.warn('Route %s has no RBAC setting', routePath);
    }
  });
  debug('getRbacRulesAndBeforeRoutes', rbacRules, before);
  return {rbacRules, before};
};
