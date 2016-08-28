'use strict';

var questions = require('base-questions');
var extname = require('gulp-extname');
var spawn = require('cross-spawn');

module.exports = function(app) {
  app.use(questions());
  app.option('layout', 'default');

  app.task('load', function(cb) {
    app.data('src/data/*.json');
    app.layouts('src/templates/layouts/*.hbs');
    app.partials('src/templates/partials/*.hbs');
    app.pages('src/templates/pages/*.hbs');
    cb();
  });

  app.task('build', ['load'], function() {
    return app.toStream('pages')
      .pipe(app.renderFile())
      .pipe(extname())
      .pipe(app.dest('_gh_pages'));
  });

  app.task('default', ['build']);

  app.task('webtask-invite', function(cb) {
    console.log();
    app.question('name', 'What would you like to name the invite webtask?');
    app.question('team', 'What\'s the slack team name you\'d like to use?');
    app.question('token', 'What\'s the slack authentication token you\'d like to use?');
    app.ask(['name', 'team', 'token'], function(err, answers) {
      if(err) return cb(err);
      console.log();
      createInvite(answers, cb);
    });
  });
};

function create(wt, params, options, cb) {
  var args = [
    'create',
    `node_modules/${wt}/dist/main.js`,
    '--name', options.name,
    '--secret', `SLACK_TEAM=${options.team}`,
    '--secret', `SLACK_TOKEN=${options.token}`
  ];
  Object.keys(params).forEach(function(key) {
    var val = params[key];
    args.push('--param');
    args.push(`${key}=${val}`);
  });

  var child = spawn('wt', args, { stdio: 'inherit' });

  child.once('close', function(code) {
    console.log();
    if (code) {
      return cb(new Error(code));
    }
    cb();
  });
}

function createInvite(options, cb) {
  create('slack-invite-wt', {}, options, cb);
}
