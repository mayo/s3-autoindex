
const path = require('path');

function buildConfig(env) {
  return require(path.join(__dirname, 'env/' + env + '.js'))(env);
}

module.exports = buildConfig;
