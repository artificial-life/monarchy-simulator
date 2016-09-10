'use strict'

global.expect = require('chai').expect;

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');

var files = ['tests/**/*.js', 'src/**/*.js'];

var test = function() {
	console.log('======================START TEST SESSION==============================');
	gulp.src('tests/**/*.test.js', {
			read: false
		})
		.pipe(plumber())
		.pipe(mocha());
};

module.exports = function() {
	test();
	gulp.watch(files, test);
}
