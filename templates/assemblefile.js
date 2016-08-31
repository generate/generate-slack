---
install:
  devDependencies:
    - 'bootstrap'
    - 'jquery'
    - 'font-awesome'
    - 'slack-invite-webtask'
    - 'slack-users-webtask'
---
'use strict';

var utils = require('./lib/utils');

module.exports = function(app) {
  var browserSync = utils.browserSync.create();

  app.use(utils.questions());
  app.use(utils.watch());
  app.option('layout', 'default');
  app.helper('json', require('./lib/helpers/json'));

  var cwd = utils.memo(process.cwd())
  var paths = {
    src: cwd('src'),
    dest: cwd('_gh_pages')
  };

  paths.data = paths.src('data');
  paths.templates = paths.src('templates');

  app.task('default', ['clean', 'copy', 'less', 'build']);
  app.task('dev', app.series('default', app.parallel(['serve', 'watch'])));

  app.task('data', function(cb) {
    app.data(paths.data('*.json').path);
    cb();
  });

  app.task('load', ['data'], function(cb) {
    app.layouts(paths.templates('layouts/*.hbs').path);
    app.partials(paths.templates('partials/*.hbs').path);
    app.pages(paths.templates('pages/*.hbs').path);
    cb();
  });

  app.task('build', ['load', 'warn'], function() {
    return app.toStream('pages')
      .pipe(app.renderFile())
      .pipe(utils.extname())
      .pipe(app.dest(paths.dest()))
      .pipe(browserSync.stream());
  });

  app.task('copy', ['copy-*']);
  app.task('copy-img', function() {
    return app.copy('**/*', paths.dest('img').path, {cwd: paths.src('img').path})
      .pipe(browserSync.stream());
  });

  app.task('copy-js', function() {
    return app.copy('**/*', paths.dest('js').path, {cwd: paths.src('js').path})
      .pipe(browserSync.stream());
  });

  app.task('copy-bootstrap', function() {
    return app.copy([
      'node_modules/bootstrap/dist/**/*',
      '!**/npm.js',
      '!**/bootstrap-theme.*',
      '!**/*.map'
    ],
    paths.dest('vendor/bootstrap').path);
  });

  app.task('copy-jquery', function() {
    return app.copy([
      'node_modules/jquery/dist/jquery.js',
      'node_modules/jquery/dist/jquery.min.js'
    ],
    paths.dest('vendor/jquery').path);
  });

  app.task('copy-font-awesome', function() {
    return app.copy([
      'node_modules/font-awesome/**',
      '!node_modules/font-awesome/**/*.map',
      '!node_modules/font-awesome/.npmignore',
      '!node_modules/font-awesome/*.txt',
      '!node_modules/font-awesome/*.md',
      '!node_modules/font-awesome/*.json'
    ],
    paths.dest('vendor/font-awesome').path);
  });

  app.task('clean', function(cb) {
    utils.del(paths.dest(), cb);
  });

  app.task('cleanPublish', function(cb) {
    utils.del('./.publish', {force: true}, cb);
  });

  app.task('less', function() {
    return app.src('site.less', {cwd: paths.src('less').path})
      .pipe(utils.less())
      .pipe(app.dest(paths.dest('css')))
      .pipe(browserSync.stream());
  });

  app.task('push', function() {
    return app.src(paths.dest('**/*').path)
      .pipe(utils.ghPages());
  });

  app.task('deploy', app.series(['push', 'cleanPublish']));

  app.task('serve', function(cb) {
    browserSync.init({
      port: 8080,
      startPath: 'index.html',
      server: {
        baseDir: paths.dest()
      }
    }, cb);
  });

  app.task('watch', function() {
    app.watch([paths.src('**/*').path], ['default']);
  });

  app.task('warn', function(cb) {
    if (typeof app.get('cache.data.site.services.invite') === 'undefined') {
      console.log();
      console.log('[WARNING]:', 'Run `$ assemble webtask-invite` to create the slack invitation service and add the service url to the site data.');
      console.log();
    }

    if (typeof app.get('cache.data.site.services.users') === 'undefined') {
      console.log();
      console.log('[WARNING]:', 'Run `$ assemble webtask-users` to create the slack user badge service and add the service url to the site data.');
      console.log();
    }
    cb();
  });

  app.task('webtasks', ['webtask-*']);

  app.task('webtask-invite', ['data'], function(cb) {
    taskCreate('Creating slack invite webtask:', app.cache.data.questions.invite, createInvite)(cb);
  });

  app.task('webtask-users', ['data'], function(cb) {
    taskCreate('Creating slack users webtask:', app.cache.data.questions.users, createUsers)(cb);
  });

  function taskCreate(msg, questions, fn) {
    return function(cb) {
      console.log();
      console.log(msg);
      console.log();
      var keys = Object.keys(questions);
      keys.forEach(function(key) {
        app.question(key, questions[key]);
      });

      app.ask(keys, {save: false}, function(err, answers) {
        if(err) return cb(err);
        console.log();
        answers.datafile = paths.data('site.json').path;
        fn(answers, cb);
      });
    };
  }

  function createInvite(options, cb) {
    utils.create(app, 'invite', {}, options, cb);
  }

  function createUsers(options, cb) {
    utils.create(app, 'users', {}, options, cb);
  }
};

