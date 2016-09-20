'use strict'

var dirs = ['src/'];

var nodemon = require('gulp-nodemon');
var demon;

module.exports = function() {
	//@NOTE: clean env every start, hanging intervals are painful
	demon = nodemon({
		script: 'src/game.js',
		watch: dirs,
		execMap: {},
		env: {
			'NODE_ENV': 'development'
		}
	});
}
