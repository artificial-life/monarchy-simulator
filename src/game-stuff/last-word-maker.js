"use strict";

var _ = require('underscore');

var quotas = require('./data/last-words.json');

module.exports = function makeLastWord(name) {
	return _.sample(quotas).replace('~', name);
};
