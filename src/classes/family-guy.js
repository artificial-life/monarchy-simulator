"use strict";

var inherits = require('util').inherits;
var async = require('async');
var _ = require('underscore');

var Puppet = require('./puppet.js');
var Pedigree = require('./pedigree.js');

var VISIT_TASK_NAME = 'visit';
var VISIT_INTERVAL = 2000; //@NOTE: msec
var ALONE = 'nothing to ping';
//@NOTE: implements family relationships

function FamilyGuy(name, family, client, ready) {
	FamilyGuy.super_.prototype.constructor.call(this, name, client);
	var self = this;

	this.pedigree = new Pedigree(family, client);
	this._addToPedigree(ready);

	this.visit = setInterval(function() {
		self.visitRelative(function(err, res) {

			if (err == ALONE) return;
			if (_.isFunction(self.reportRelativeStatus)) self.reportRelativeStatus(err, res);
		});
	}, VISIT_INTERVAL);
}

inherits(FamilyGuy, Puppet);

FamilyGuy.prototype.relativeStatusHandler = function(callback) {
	this.reportRelativeStatus = callback;
};

FamilyGuy.prototype.visitRelative = function(callback) {
	var self = this;
	var pedigree = this.pedigree;
	var queue = self.queue;

	async.waterfall([
		pedigree.getRelative.bind(pedigree),
		function(res, cb) {
			if (self._isSelf(res)) {
				cb(ALONE, null); //@NOTE: oh gosh, it seems i'm alone here
				return;
			}

			cb(null, res);
		},
		function(res, cb) {
			//@NOTE: using default timeout
			var name = res.name;
			var index = res.index;

			self.queue.request(name + "://" + VISIT_TASK_NAME, self._getPassport(), function(err, res) {

				if (err && err == 'timeout') {
					cb(null, {
						status: 'dead',
						name: name,
						index: index
					});
					return;
				}

				if (err && err != 'timeout') {
					cb(err, res);
					return;
				}

				cb(null, {
					status: 'alive',
					name: name,
					index: index
				});
			});
		},
	], callback);
};



FamilyGuy.prototype._isSelf = function(res) {
	return this.name == res.name && this.pedigree.birth == res.index;
};

FamilyGuy.prototype._getPassport = function() {
	return {
		name: this.name,
		index: this.pedigree.birth
	};
};

FamilyGuy.prototype._addToPedigree = function(ready) {
	var self = this;

	this.pedigree.add(this.name, function() {

		self.queue.do(VISIT_TASK_NAME, function(data, reply) {
			reply(null, self._getPassport());
		});

		if (_.isFunction(ready)) ready();
	});
};

//@NOTE: when relative dead
FamilyGuy.prototype.correctPedigree = function(passport, callback) {
	this.pedigree.exclude(passport, callback);
};

FamilyGuy.prototype.destroy = function() {
	(!!this.visit) && clearInterval(this.visit);
	FamilyGuy.super_.prototype.destroy.call(this);
};

FamilyGuy.prototype.familyEvent = function(event_name, data) {
	return this.pedigree.familyEvent(event_name, data);
};

module.exports = FamilyGuy;
