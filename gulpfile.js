'use strict'

var gulp = require("gulp");

var test_task = require('./gulp-tasks/test.js');
var game_task = require('./gulp-tasks/game-test.js');
var lint = require('./gulp-tasks/lint.js');

gulp.task('test', test_task);
gulp.task('lint', lint);
gulp.task('game-task', game_task);
