global.expect = require('chai').expect;

var gulp = require("gulp");
var mocha = require('gulp-mocha');

gulp.src('tests/**/*.test.js', {
		read: false
	})
	.pipe(mocha());
