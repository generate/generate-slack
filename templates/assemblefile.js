'use strict';

var questions = require('base-questions');
var memo = require('memoize-path');
var extname = require('gulp-extname');
var spawn = require('cross-spawn');

module.exports = function(app) {
  app.use(questions());
  app.option('layout', 'default');

  var cwd = memo(process.cwd())
  var paths = {
    src: cwd('src'),
    det: cwd('_gh_pages')
  };

  paths.data = paths.src('data');
  paths.templates = paths.src('templates');

  app.task('data', function(cb) {
    app.data(paths.data('*.json'));
    cb();
  });

  app.task('load', ['data'], function(cb) {
    app.layouts(paths.templates('layouts/*.hbs').path);
    app.partials(paths.templates('partials/*.hbs').path);
    app.pages(paths.templates('pages/*.hbs').path);
    cb();
  });

  app.task('build', ['load'], function() {
    return app.toStream('pages')
      .pipe(app.renderFile())
      .pipe(extname())
      .pipe(app.dest(paths.dest()));
  });

  app.task('copy', function() {
    return app.copy('**/*', paths.dest('assets').path, {cwd: paths.src('assets').path});
  });

  app.task('clean', function(cb) {
    del(paths.dest(), cb);
  });

  app.task('default', ['clean', 'copy', 'build']);

  app.task('webtasks', ['webtask-*']);

  app.task('webtask-invite', ['data'], function(cb) {
    taskCreate('Creating slack invite webtask:', app.cache.data.questions.invite, createInvite)(cb);
  });

  app.task('webtask-users', ['data'], function(cb) {
    taskCreate('Creating slack users webtask:', app.cache.data.questions.users, createUsers)(cb);
  });
};

function taskCreate(msg, questions, fn) {
  return function(cb) {
    console.log();
    console.log(msg);
    console.log();
    var keys = Object.keys(questions);
    keys.forEach(function(key) {
      app.question(key, questions[key]);
    });

    app.ask(keys, function(err, answers) {
      if(err) return cb(err);
      console.log();
      fn(answers, cb);
    });
  };
}

function create(wt, params, options, cb) {
  var args = [
    'create',
    `node_modules/slack-${wt}-wt/dist/main.js`,
    '--name', options.name,
    '--secret', `SLACK_TEAM=${options.team}`,
    '--secret', `SLACK_TOKEN=${options.token}`
  ];
  Object.keys(params).forEach(function(key) {
    var val = params[key];
    args.push('--param');
    args.push(`${key}=${val}`);
  });

  var buffer = '';
  var child = spawn('wt', args, { stdio: 'inherit' });
  child.stdout.on('data', function(data) {
    buffer += data;
  });

  child.once('close', function(code) {
    console.log('=============== OUTPUT ================');
    console.log(buffer);
    console.log('=============== OUTPUT ================');
    if (code) {
      return cb(new Error(code));
    }
    cb();
  });
}

function createInvite(options, cb) {
  create('invite', {}, options, cb);
}

function createUsers(options, cb) {
  create('invite', {}, options, cb);
}
