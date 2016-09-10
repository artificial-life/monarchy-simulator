'use strict'
var parseArgs = require('minimist')

var default_args = {
	minions: 5,
	"life-time": 10000,

};
var aliases = {
	minions: 'm',
	"life-time": 'lt'
};


module.exports = function () {
	console.log(parseArgs(process.argv, {
		default: default_args,
		alias: aliases
	}));
};
