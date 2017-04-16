const webpackMerge = require('webpack-merge');
const path = require('path');

const commonConfig = require('./base.js');
const _basedir = path.join(__dirname, '..');

module.exports = function(env) {
  return webpackMerge(commonConfig(), {

    devServer: {
      contentBase: path.join(_basedir, "dist"),
      port: 9000
    },

  })
}
