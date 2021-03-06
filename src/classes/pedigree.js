"use strict";

var async = require('async');
var _ = require('underscore');

function Pedigree(family, client) {
	this.client = client;
	this.family = family;
	this.birth = -1;
}


Pedigree.prototype.add = function(who, callback) {
	var self = this;

	async.waterfall([
		function(cb) {
			self.client.time(cb);
		},
		function(time, cb) {
			var now = time[0] + time[1];
			self.birth = now;

			self.client.zadd(self.family, [now, who], function(err, res) {
				cb(err, self.birth);

				if (!err) self.familyEvent('new-child', who);
			});
		}
	], callback);

};

Pedigree.prototype.exclude = function(passport, callback) {
	//@NOTE: serice id (relative) SHOULD be uniq, so delete only one
	var index = passport.index;
	var args = [this.family, index, index];
	var self = this;
	this.client.zremrangebyscore(args, function(err, res) {
		callback(err, res);
		if (!err) self.familyEvent('graveyard', passport.name);
	});
};

Pedigree.prototype.familyEvent = function(event_name, data) {
	this.client.publish(this.family + '-' + event_name, data);
};

Pedigree.prototype.getRelative = function(callback) {
	var args = [this.family, this.birth, 0, 'WITHSCORES', 'LIMIT', 1, 1];
	var self = this;

	this.client.zrevrangebyscore(args, function(err, response) {
		if (err) {
			callback(err, null);
			return;
		}
		if (!_.isEmpty(response)) {
			callback(err, self._parseRelative(response));
			return;
		}
		self.getLast(callback);
	});
};


Pedigree.prototype.getLast = function(callback) {
	var self = this;
	var args = [this.family, '+inf', 0, 'WITHSCORES', 'LIMIT', 0, 1];

	this.client.zrevrangebyscore(args, function(err, response) {
		var data = self._parseRelative(response);
		callback(err, data.name == self.name ? null : data);
	});
};


Pedigree.prototype._parseRelative = function(response) {
	if (_.isEmpty(response)) return null;

	var name = response[0];
	var index = response[1];

	return {
		name: name,
		index: index
	};
};
module.exports = Pedigree;
