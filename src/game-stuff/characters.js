"use strict";

var _ = require('underscore');

var makeName = require('./name-maker.js');
var canAct = require('./can-act.js');
var makeLastWord = require('./last-word-maker.js');

var characters = [];

module.exports = {
	updateStatus: function(name, status) {
		var target = this.findByName(name);

		if (!target) return false;
		target.status = status;

		return true;
	},
	getById: function(id) {
		return characters[id - 1];
	},
	findByName: function(name) {
		return _.find(characters, function(character) {
			return character.name == name;
		});
	},
	canAct: canAct,
	makeLastWord: makeLastWord,
	add: function() {
		var name = makeName();
		characters.push({
			name: name,
			status: 'wandering'
		});

		return name;
	},
	findKing: function() {
		return _.find(characters, function(character) {
			return character.status == 'King';
		});
	},
	list: function() {
		_.each(characters, function(character, index) {
			console.log('#%d %s is %s', index + 1, character.name, character.status == "King" ? "The King" : character.status);
		});
	}
};
