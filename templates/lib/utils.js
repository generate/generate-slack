---
install:
  devDependencies:
    - 'base-questions@0.7.4'
    - 'cross-spawn'
    - 'delete'
    - 'gulp-extname'
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
require('cross-spawn', 'spawn');
require('delete', 'del');
require('gulp-extname', 'extname');
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
}

/**
 * Expose `utils` modules
 */

module.exports = utils;
