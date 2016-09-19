'use strict'

var gulp = require("gulp");

var test_task = require('./gulp-tasks/test.js');

gulp.task('test', test_task);
