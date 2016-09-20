"use strict";
//@NOTE: ...of thrones, ofc.

var redis = require('redis');
var readline = require('readline');

var MessageQueue = require('../src/classes/message-queue.js');
var Router = require('./game-stuff/router.js');
var client = redis.createClient();

var Start = function() {
	require('./game-stuff/epigraph.js');

	var queue = new MessageQueue(client, 'game-master');
	var characters = require('./game-stuff/characters.js');

	queue.subscribe('royal-family-new-child', function(name) {
		characters.updateStatus(name, 'alive');
	});

	queue.subscribe('royal-family-coronation', function(name) {
		var success = characters.updateStatus(name, 'King');
		success && console.log('%s was crowned in %d', name, Date.now());
	});

	queue.subscribe('royal-family-graveyard', function(name) {
		var success = characters.updateStatus(name, 'dead');
		success && console.log(characters.makeLastWord(name));
	});

	var rl = readline.createInterface({
		input: process.stdin
	});

	var router = Router(characters, queue);

	rl.on('line', router.command.bind(router));
};

client.del('royal-family', Start);
