'use strict'

global.expect = require('chai').expect;

var gulp = require('gulp');
var mocha = require('gulp-mocha');

const files = ['tests/**/*.js', 'src/**/*.js'];
var test = function () {
	gulp.src('tests/**/*.test.js', {
			read: false
		})
		.pipe(mocha());
};

module.exports = function () {
	test();
	gulp.watch(files, test);
}
