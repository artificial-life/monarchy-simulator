'use strict'

var _ = require('underscore');
var minimist = require('minimist');
var redis = require('redis');

var Royalty = require('./classes/royalty.js');

var args = minimist(process.argv.slice(2));
var name = args.name;

if (!name) throw new Error('choose name');

var client = redis.createClient();

var human = new Royalty(name, client, function () {
	console.log('%s ready', name);
});


human.onCommand(function eventHandler(msg, callback) {
	function onComplete() {
		var error = Math.random() > 0.85;
		callback(error, msg);
	};

	// processing takes time...

	setTimeout(onComplete, Math.floor(Math.random() * 1000));

});

human.orderTemplate(function getMessage() {
	this.cnt = this.cnt || 0;
	return this.cnt++;
});
