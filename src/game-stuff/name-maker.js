"use strict";

var _ = require('underscore');
var os = require("os");

var domain = os.hostname();
domain = domain[0].toUpperCase() + domain.slice(1);

var nicknames = require('./data/nicknames.json');
var names = require('./data/names.json');
var nicknames_indexes = _.range(nicknames.length);

var excluded = [];

function nameIndex() {
	return (Math.random() * names.length) | 0;
}

function nicknameIndex(index) {
	var to_ex = excluded[index] || [];
	var diff = _.difference(nicknames_indexes, to_ex);
	var nickname_index = _.sample(diff);

	(excluded[index] || (excluded[index] = [])).push(nickname_index);

	return nickname_index;
}

function makeName() {
	var name_index = nameIndex();
	var name = names[name_index];
	var nickname_index = nicknameIndex(name_index);
	var nickname = nicknames[nickname_index];

	var full_name = nickname.replace('~', name);
	return full_name + ' of ' + domain;
}

module.exports = makeName;
