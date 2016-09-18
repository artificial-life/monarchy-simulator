'use strict'

var async = require('async');

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
			var now = time[0] * 1000 + (time[1] / 1000 | 0);
			self.birth = now;

			self.client.zadd(self.family, [now, who], function(err, res) {
				cb(err, self.birth)
			});
		}
	], callback);

};

Pedigree.prototype.exclude = function(relative, callback) {
	this.client.lrem(relative, 1, callback); //@NOTE: serice id (relative) SHOULD be uniq, so delete only one
};

Pedigree.prototype.getRelative = function(callback) {
	var args = [this.family, this.birth, 0, 'WITHSCORES', 'LIMIT', 1, 1];
	var self = this;
	this.client.zrevrangebyscore(args, function(err, response) {
		if (err) {
			callback(err, null);
			return;
		}
		if (response != null) {
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

		callback(err, self._parseRelative(response));
	});
};


Pedigree.prototype._parseRelative = function(response) {
	return {
		name: response[0],
		index: response[1]
	};
};
module.exports = Pedigree;
