'use strict'

var dirs = ['src/', 'tests/'];

var nodemon = require('gulp-nodemon');
var demon;

module.exports = function() {
	//@NOTE: clean env every start, hanging intervals are painful
	demon = nodemon({
		script: 'tests/run.js',
		watch: dirs,
		execMap: {},
		env: {
			'NODE_ENV': 'development'
		}
	});
}
