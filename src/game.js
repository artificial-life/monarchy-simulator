//@NOTE: ...of thrones, ofc.
'use strict'

var redis = require('redis');
var async = require('async');
var child_process = require('child_process');
var readline = require('readline');
var _ = require('underscore');

var MessageQueue = require('../src/classes/message-queue.js');
var makeName = require('./game-stuff/name-maker.js');
var makeLastWord = require('./game-stuff/last-word-maker.js');
var canAct = require('./game-stuff/can-act.js');

var client = redis.createClient();
var queue = new MessageQueue(client, 'game-master');


client.del('royal-family', function() {
	require('./game-stuff/epigraph.js');
});

var characters = [];

var rl = readline.createInterface({
	input: process.stdin
});


function findByName(name) {
	return _.find(characters, function(character) {
		return character.name == name;
	});
}

queue.subscribe('royal-family-new-child', function(name) {
	var target = findByName(name);
	target && (target.status = 'alive');
});

queue.subscribe('royal-family-coronation', function(name) {
	var target = findByName(name);
	target && (target.status = 'King');
	target && console.log('%s was crowned in %d', target.name, Date.now());
});

queue.subscribe('royal-family-graveyard', function(name) {
	var target = findByName(name);
	target && (target.status = 'dead');
	target && console.log(makeLastWord(target.name));
});


var routs = {
	rise: function(count) {
		for (var i = 0; i < count; i++) {
			var name = makeName();
			characters.push({
				name: name,
				status: 'wandering'
			});
			child_process.fork('./src/index.js', ['--name', name]);
		}
	},
	list: function() {
		_.each(characters, function(character, index) {
			console.log('#%d %s is %s', index + 1, character.name, character.status == "King" ? "The King" : character.status);
		})
	},
	crown: function(id) {
		var character = characters[id - 1];

		if (!canAct(character)) return;

		var king = _.find(characters, function(character) {
			return character.status == 'King'
		});
		if (king) {
			console.log('Actually we have The King now. May be something should happen with him? Little accident?');
			return;
		}

		queue.request(character.name + '://puppet-action', {
			action: 'be-king'
		}, function(err, res) {
			if (err) console.log('Something bad happened', err);
		})

	},
	punish: function(id) {
		var character = characters[id - 1];

		if (!canAct(character)) return;

		queue.request(character.name + '://puppet-action', {
				action: 'drain-errors'
			},
			function(err, res) {
				if (!err) console.log('%s: %d piles of errors removed', character.name, res);
			}, 30000)
	},
	kill: function(id) {
		var character = characters[id - 1];

		if (!canAct(character)) return;

		queue.request(character.name + '://puppet-action', {
				action: 'die'
			},
			function(err, res) {
				if (err) {
					console.log('Something bad already happened with %s', character.name);
					return;
				}
				console.log('%s going to die', character.name);
			})
	},
	cleaner: function() {
		var name = makeName();
		characters.push({
			name: name,
			status: 'wandering'
		});
		child_process.fork('./src/index.js', ['--name', name, 'getErrors']);
	},
	help: function() {
		console.log('Commands:');
		console.log('1) rise num - spawns characters');
		console.log('2) list - show all characters and their status');
		console.log('3) kill id - kill character by id from list');
		console.log('4) crown id - crown character by id from list');
		console.log('5) punish id - clear error log');
		console.log('6) cleaner - spawn cleaner');
		console.log('7) help - helps');
	}
};

rl.on('line', function(command_str) {
	var parts = command_str.split(' ');
	var command = parts[0];
	var value = parts[1];
	var method = routs[command];

	if (method instanceof Function) {
		method(value)
	} else {
		console.log('bad command');
	}
});
