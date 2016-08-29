'use strict';

var path = require('path');
var isValid = require('is-valid-app');

module.exports = function(app) {
  // return if the generator is already registered
  if (!isValid(app, 'generate-slack')) return;

  app.use(require('generate-defaults'));
  app.use(require('generate-install'));

  /**
   * Generate a `index.js` file to the current working directory. Learn how to [customize
   * behavior(#customization) or override built-in templates.
   *
   * ```sh
   * $ gen slack:slack
   * ```
   * @name slack:slack
   * @api public
   */

  task(app, 'slack', ['**/*', '!**/img/**/*'], ['copy-img']);
  app.task('copy-img', function() {
    var src = app.options.srcBase || path.join(__dirname, 'templates');
    var dest = path.join(app.cwd, 'src/img');
    return app.copy('src/img/**/*', dest, {cwd: src});
  });

  /**
   * Alias for running the [slack](#slack) task with the following command:
   *
   * ```sh
   * $ gen slack
   * ```
   * @name slack
   * @api public
   */

  app.task('default', ['slack']);
};

/**
 * Create a task with the given `name` and glob `pattern`
 */

function task(app, name, pattern, dependencies) {
  app.task(name, dependencies || [], function(cb) {
    if (!pattern) return cb();
    return file(app, pattern);
  });
}

function file(app, pattern) {
  var src = app.options.srcBase || path.join(__dirname, 'templates');
  return app.src(pattern, {cwd: src})
    .pipe(app.renderFile('*')).on('error', console.log)
    .pipe(app.conflicts(app.cwd))
    .pipe(app.dest(app.cwd));
}
