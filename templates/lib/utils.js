---
install:
  devDependencies:
    - 'base-questions@0.7.4'
    - 'base-watch'
    - 'browser-sync'
    - 'cross-spawn'
    - 'delete'
    - 'gulp-extname'
    - 'gulp-gh-pages'
    - 'gulp-less'
    - 'lazy-cache'
    - 'memoize-path'
    - 'read-file'
    - 'write-json'
---
'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('base-questions', 'questions');
require('base-watch', 'watch');
require('browser-sync');
require('cross-spawn', 'spawn');
require('delete', 'del');
require('gulp-extname', 'extname');
require('gulp-gh-pages', 'ghPages');
require('gulp-less', 'less');
require('memoize-path', 'memo');
require('read-file', 'read');
require('write-json', 'writeJSON');

require = fn;

utils.readJSON = function(fp, cb) {
  utils.read(fp, function(err, content) {
    if (err) return cb(err);
    try {
      cb(null, JSON.parse(content));
      return;
    } catch (err) {
      cb(err);
    }
  });
};

utils.create = function(app, wt, params, options, cb) {
  var fp = options.datafile;
  var args = [
    'create',
    'node_modules/slack-' + wt + '-webtask/dist/main.js',
    '--name', options.name,
    '--secret', 'SLACK_TEAM=' + options.team,
    '--secret', 'SLACK_TOKEN=' + options.token
  ];
  Object.keys(params).forEach(function(key) {
    var val = params[key];
    args.push('--param');
    args.push(key + '=' + val);
  });

  var buffer = '';
  var error = '';
  var child = utils.spawn('wt', args);
  child.stdout.on('data', function(data) {
    buffer += data;
  });

  child.stderr.on('data', function(data) {
    error += data;
  });

  child.once('close', function(code) {
    if (code) {
      return cb(new Error(error));
    }
    console.log('"' + options.name + '" webtask created.');

    var lines = buffer.split('\n\n').map(function(str) {
      return str.trim();
    });
    var url = lines[lines.length - 1];

    console.log('Setting "site.services.' + wt + '" to "' + url + '"');
    app.data(['site', 'services', wt].join('.'), url);

    utils.readJSON(fp, function(err, data) {
      if (err) return cb(err);
      data.services[wt] = url;
      utils.writeJSON(fp, data, cb);
    });
  });
};

/**
 * Expose `utils` modules
 */

module.exports = utils;
