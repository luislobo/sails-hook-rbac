'use strict';
const {chain} = require('lodash');

const starRegEx = new RegExp('\\*', 'g');
const colonRegEx = new RegExp('\:', 'g');

function inferCanName(routeConfig, routePath) {
  const verb = chain(routePath).split(' ').first().toLower().value();
  // if we have controller and action use them
  return routeConfig.controller && routeConfig.action ?
      `${verb}-${routeConfig.controller}-${routeConfig.action}`
      // if we only have action, use that
      : (routeConfig.action ?
          `${verb}-${routeConfig.action}` :
          // else, create it from the route
          chain(routePath)
              // if * is present, replace with `all`
              .replace(starRegEx, 'ALL')
              // if param is present, replace with `-p-`
              .replace(colonRegEx, '-p-')
              // now, make it all separated by -
              .kebabCase().value());
}

module.exports = {
  getCan: (routeConfig, routePath) => inferCanName(routeConfig, routePath),
};
