"use strict";

var _ = require('underscore');
var async = require('async');
var child_process = require('child_process');

module.exports = function(characters, queue) {
	return {
		command: function(command_str) {

			var parts = command_str.split(' ');
			var command = parts[0];
			var value = parts[1];
			var method = this[command];

			if (method instanceof Function) {
				method.apply(this, parts.slice(1));
			} else {
				console.log('bad command; type help for a list of commands');
			}
		},
		rise: function(count) {
			for (var i = 0; i < count; i++) {
				var name = characters.add();
				child_process.fork('./src/index.js', ['--name', name]);
			}
		},
		list: function() {
			characters.list();
		},
		crown: function(id) {
			var character = characters.getById(id);

			if (!characters.canAct(character)) return;

			var king = characters.findKing();

			if (king) {
				console.log('Actually we have The King now. May be something should happen with him? Little accident?');
				return;
			}

			queue.request(character.name + '://puppet-action', {
				action: 'be-king'
			}, function(err, res) {
				if (err) console.log('Something bad happened', err);
			});

		},
		punish: function(id) {
			var character = characters.getById(id);

			if (!characters.canAct(character)) return;

			queue.request(character.name + '://puppet-action', {
					action: 'drain-errors'
				},
				function(err, res) {
					if (!err) console.log('%s: %d piles of errors removed', character.name, res);
				}, 30000);
		},
		kill: function(id) {
			var character = characters.getById(id);

			if (!characters.canAct(character)) return;

			queue.request(character.name + '://puppet-action', {
					action: 'die'
				},
				function(err, res) {
					if (err) {
						console.log('Something bad already happened with %s', character.name);
						return;
					}
					console.log('%s going to die', character.name);
				});
		},
		massacre: function() {
			var args = [].slice.call(arguments);
			var self = this;
			_.forEach(args, function(arg) {
				self.kill(arg);
			});
		},
		cleaner: function() {
			var name = characters.add();
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
};
