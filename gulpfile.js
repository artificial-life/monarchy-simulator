'use strict'

var gulp = require("gulp");

var serve_task = require('./gulp-tasks/serve.js');
var test_task = require('./gulp-tasks/test.js');

gulp.task('test', test_task);

gulp.task('serve', serve_task);
