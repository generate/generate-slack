---
install:
  devDependencies:
    - 'bootstrap'
    - 'jquery'
    - 'font-awesome'
---
'use strict';

var utils = require('./lib/utils');

module.exports = function(app) {
  app.use(utils.questions());
  app.option('layout', 'default');
  app.helper('json', require('./lib/helpers/json'));

  var cwd = utils.memo(process.cwd())
  var paths = {
    src: cwd('src'),
    dest: cwd('_gh_pages')
  };

  paths.data = paths.src('data');
  paths.templates = paths.src('templates');

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

  app.task('build', ['load'], function() {
    if (typeof app.get('cache.data.site.services.invite') === 'undefined') {
      console.log();
      console.log('[WARNING]:', 'Run `$ assemble webtask-invite` to create the slack invitation service and add the service url to the site data.');
      console.log();
    }

    return app.toStream('pages')
      .pipe(app.renderFile())
      .pipe(utils.extname())
      .pipe(app.dest(paths.dest()));
  });

  app.task('copy', ['copy-*']);
  app.task('copy-img', function() {
    return app.copy('**/*', paths.dest('img').path, {cwd: paths.src('img').path});
  });

  app.task('copy-js', function() {
    return app.copy('**/*', paths.dest('js').path, {cwd: paths.src('js').path});
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

  app.task('less', function() {
    return app.src('site.less', {cwd: paths.src('less').path})
      .pipe(utils.less())
      .pipe(app.dest(paths.dest('css')));
  });

  app.task('default', ['clean', 'copy', 'less', 'build']);

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
        fn(answers, cb);
      });
    };
  }

  function create(wt, params, options, cb) {
    var args = [
      'create',
      'node_modules/slack-' + wt + '-wt/dist/main.js',
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

      var fp = paths.data('site.json').path;
      utils.readJSON(fp, function(err, data) {
        if (err) return cb(err);
        data.services[wt] = url;
        utils.writeJSON(fp, data, cb);
      });
    });
  }

  function createInvite(options, cb) {
    create('invite', {}, options, cb);
  }

  function createUsers(options, cb) {
    create('users', {}, options, cb);
  }
};

