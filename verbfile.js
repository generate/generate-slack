'use strict';

var generator = require('./');
var trees = require('verb-trees');
var del = require('delete');

/**
 * Build docs: `$ verb`
 */

module.exports = function(app) {
  app.use(require('verb-generate-readme'));

  app.use(trees(generator, ['default']));

  app.task('docs', function(cb) {
    return app.src('docs/trees.md', {cwd: __dirname})
      .pipe(app.renderFile('*'))
      .pipe(app.dest(app.cwd));
  });

  app.task('delete', function(cb) {
    del('.temp-trees', cb);
  });

  app.task('default', ['trees', 'readme', 'docs', 'delete']);
};
