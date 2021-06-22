'use strict';
const debug = require('debug')('sails-hook-rbac:initializeRules');

const {inferCanName} = require('./helper');

const {each, get, isFunction, isString, toLower} = require('lodash');

module.exports = function initializeRules(sails, hookConfig) {
  const rbacRules = [];
  each(sails.config.routes, (routeConfig, routePath) => {
    // if the route config has an rbac configuration set, add it to the hook
    if (routeConfig.rbac) {
      each(routeConfig.rbac, (rule, role) => {
        rule.a = role; // eslint-disable-line id-length
        // if `can` (permission) name is not set explicitly, automatically infer `can` name based
        // on the route config controller.action, and if no controller + action present,
        // use routePath
        if (!rule.can) {
          // and if not present,
          rule.can = inferCanName(routeConfig, routePath);
        }
        if (rule.when) {
          let whenFn;
          if (isFunction(rule.when)) {
            whenFn = rule.when;
          } else if (isString(rule.when)) {
            const helperPath = hookConfig.helper.path;
            const functionName = rule.when;

            whenFn = function(params, next) {
              // at this time, sails does not have services and helpers
              // loaded, so get them dynamically
              const fn = get(sails, `${toLower(helperPath)}.${functionName}`);
              debug('whenFn', isFunction(fn), helperPath, functionName);
              return fn(params, next);
            };
          }
          if (isFunction(whenFn)) {
            rule.when = whenFn;
          } else {
            sails.log.warn(
                'Route %s has an RBAC when configuration issue. Disabling when.',
                routePath, rule.when);
            delete rule.when;
          }
        }
        sails.log.info('RBAC: Route %s => %s can %s',
            routePath, rule.a, rule.can);
        rbacRules.push(rule);
      });
    } else {
      sails.log.warn('Route %s has no RBAC setting', routePath);
    }
  });
  debug('rbacRules', rbacRules);
  return rbacRules;
};
