'use strict'
var inherits = require('util').inherits;
var async = require('async');

var FamilyGuy = require('./family-guy.js');
var MessageQueue = require('./message-queue.js');


var ERROR_LIST = 'failed-orders';
var ORDERS = 'royal-orders';
var PUBLISH_INTERVAL = 500;
var FAMILY_NAME = 'royal-family';
//@NOTE: figths for the crown

function Royalty(name, client, ready) {
	Royalty.super_.prototype.constructor.call(this, name, FAMILY_NAME, client, ready);
	this.orders_int = false;
	this.beHeir();
}

inherits(Royalty, FamilyGuy);

Royalty.prototype.onCommand = function (callback) {
	this.commandHandler = callback;
};

Royalty.prototype.orderTemplate = function (callback) {
	this.makeOrder = callback;
};

Royalty.prototype.reportRelativeStatus = function (err, res) {
	if (res.status != 'dead') return;
	var self = this;

	async.waterfall([
		function (cb) {
			self.correctPedigree(res.index, cb)
		},
		function (count, cb) {
			var throne = self._throne();
			self.client.get(throne, cb);
		},
	], function (err, king) {
		if (err) throw new Error(err);
		var was_king = king != res.name;

		if (!was_king) return;

		self.beKing();
	})
};

Royalty.prototype.errorHandler = function (error, msg) {
	if (!error) return;
	this.client.rpush(ERROR_LIST, msg);
};

Royalty.prototype.drainErrors = function (drained) {
	var count = 0;
	this.queue.drain(ERROR_LIST, function () {
		count++
	}, function (err, res) {
		console.log('%d total errors drained', count);
		drained(err, res);
	})
};


Royalty.prototype.beKing = function (callback) {
	var self = this;
	this.queue.unact(ORDERS);
	var takeThrone = this.client.set.bind(this.client, this._throne(), this.name);

	async.waterfall([
		takeThrone,
		function (res, cb) {
			self.orders_int = setInterval(function () {
				if (!self.makeOrder) return; //@TEMP
				var order = self.makeOrder();
				self.queue.command(ORDERS, order);
			}, PUBLISH_INTERVAL);

			cb();
		}
	], callback);

};

Royalty.prototype.beHeir = function () {
	var self = this;
	this.orders_int && clearInterval(this.orders_int);

	this.queue.act(ORDERS, function (msg) {
		if (self.commandHandler instanceof Function) self.commandHandler(msg, self.errorHandler.bind(self));
	});
};

Royalty.prototype._throne = function () {
	return FAMILY_NAME + '-king';
};
module.exports = Royalty;
