var jshint = require('gulp-jshint');
var gulp = require('gulp');

module.exports = function() {
	return gulp.src('./src/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
};
