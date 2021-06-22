'use strict';
const debug = require('debug')('sails-hook-rbac:initialize');

const initializeRules = require('./initializeRules');

module.exports = function initialize(hook, sails, done) {
  debug('starting initialize');

  try {
    const configKey = hook.configKey;
    const hookConfig = sails.config[configKey];

    // If disabled. Do not load anything
    if (!hookConfig) {
      debug('Hook not loaded: disabled by configuration');
      return done();
    }

    // Inject appropriate when function in rules within sails.config.routes
    initializeRules(sails, hookConfig);

    // Set up listener to bind shadow routes when the time is right.
    //
    // Always wait until after router has bound static routes.
    // If orm hook is enabled, also wait until models are known.
    const eventsToWaitFor = new Set();

    try {

      /**
       * Check hooks availability
       */
      hookConfig.waitFor.forEach((requiredHook) => {
        if (!sails.hooks[requiredHook]) {
          throw new Error(
              'Cannot use `' + configKey + '` hook without the `' +
              requiredHook +
              '` hook.');
        }
        eventsToWaitFor.add('hook:' + requiredHook + ':loaded');
      });

    } catch (err) {
      if (err) {
        return done(err);
      }
    }

    debug('waiting for', eventsToWaitFor);
    sails.after([...eventsToWaitFor], () => {
      debug('Hook initialized');
      return done();
    });
  } catch (err) {
    return done(err);
  }

};
