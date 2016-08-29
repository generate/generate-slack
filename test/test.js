'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var generate = require('generate');
var bddStdin = require('bdd-stdin');
var npm = require('npm-install-global');
var del = require('delete');
var generator = require('../');
var pkg = require('../package');
var app;

var fixtures = path.resolve.bind(path, __dirname, 'fixtures');
var actual = path.resolve.bind(path, __dirname, 'actual');

function exists(name, re, cb) {
  if (typeof re === 'function') {
    cb = re;
    re = new RegExp(/./);
  }

  return function(err) {
    if (err) return cb(err);
    var filepath = actual(name);
    fs.stat(filepath, function(err, stat) {
      if (err) return cb(err);
      assert(stat);
      var str = fs.readFileSync(filepath, 'utf8');
      assert(re.test(str));
      del(actual(), cb);
    });
  };
}

describe('generate-slack', function() {
  if (!process.env.CI && !process.env.TRAVIS) {
    before(function(cb) {
      npm.maybeInstall('generate', cb);
    });
  }

  before(function(cb) {
    del(actual(), cb);
  });

  beforeEach(function() {
    app = generate({silent: true});
    app.cwd = actual();

    app.option('dest', actual());
    app.option('askWhen', 'not-answered');
    app.option('overwrite', function(file) {
      return /actual/.test(file.path);
    });
    app.option('site.title', 'Generate Slack Test');
    app.option('site.twitter', 'doowb');
    app.option('site.github', 'doowb');
  });

  afterEach(function(cb) {
    del(actual(), cb);
  });

  describe('tasks', function() {
    beforeEach(function() {
      app.use(generator);
    });

    it('should run the `default` task with .build', function(cb) {
      app.build('default', exists('assemblefile.js', cb));
    });

    it('should run the `default` task with .generate', function(cb) {
      app.generate('default', exists('assemblefile.js', cb));
    });
  });

  if (!process.env.CI && !process.env.TRAVIS) {
    describe('generator (CLI)', function() {
      beforeEach(function() {
        bddStdin('\n');
        app.use(generator);
      });

      it('should run the default task using the `generate-slack` name', function(cb) {
        app.generate('generate-slack', exists('assemblefile.js', cb));
      });

      it('should run the default task using the `generator` generator alias', function(cb) {
        app.generate('slack', exists('assemblefile.js', cb));
      });
    });
  }

  describe('generator (API)', function() {
    beforeEach(function() {
      bddStdin('\n');
    });

    it('should run the default task on the generator', function(cb) {
      app.register('slack', generator);
      app.generate('slack', exists('assemblefile.js', cb));
    });

    it('should run the `slack` task', function(cb) {
      app.register('slack', generator);
      app.generate('slack:slack', exists('assemblefile.js', cb));
    });

    it('should run the `default` task when defined explicitly', function(cb) {
      app.register('slack', generator);
      app.generate('slack:default', exists('assemblefile.js', cb));
    });
  });

  describe('sub-generator', function() {
    beforeEach(function() {
      bddStdin('\n');
    });

    it('should work as a sub-generator', function(cb) {
      app.register('foo', function(foo) {
        foo.register('slack', generator);
      });
      app.generate('foo.slack', exists('assemblefile.js', cb));
    });

    it('should run the `default` task by default', function(cb) {
      app.register('foo', function(foo) {
        foo.register('slack', generator);
      });
      app.generate('foo.slack', exists('assemblefile.js', cb));
    });

    it('should run the `slack:default` task when defined explicitly', function(cb) {
      app.register('foo', function(foo) {
        foo.register('slack', generator);
      });
      app.generate('foo.slack:default', exists('assemblefile.js', cb));
    });

    it('should run the `slack:slack` task', function(cb) {
      app.register('foo', function(foo) {
        foo.register('slack', generator);
      });
      app.generate('foo.slack:slack', exists('assemblefile.js', cb));
    });

    it('should work with nested sub-generators', function(cb) {
      app
        .register('foo', generator)
        .register('bar', generator)
        .register('baz', generator);
      app.generate('foo.bar.baz', exists('assemblefile.js', cb));
    });
  });
});
