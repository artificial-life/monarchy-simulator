'use strict'

var redis = require('redis');
var async = require('async');
var EventEmitter = require('events');
var inherits = require('util').inherits;

function MessageQueue(client) {
	this.subscriber = client.duplicate();
	this.client = client;

	var self = this;
	this.subscriber.on("message", function(chanel, message) {
		self.emit(chanel, message);
	});

	this.subscriber.on('subscribe', function() {
		self.emit('subscribe');
	});
}

inherits(MessageQueue, EventEmitter);

MessageQueue.prototype.subscribe = function(event_name, callback) {
	var self = this;
	var notification = this._notificationName(event_name);
	var list = this._listName(event_name);
	var sink = this._drain.bind(this, list, callback);

	this.subscriber.subscribe(notification);
	sink()

	this.on(notification, sink);
};

MessageQueue.prototype.closeConnection = function() {
	this.subscriber.end(false);
};

MessageQueue.prototype.publish = function(event_name, data, callback) {
	var notification = this._notificationName(event_name);
	var list = this._listName(event_name);
	var self = this;
	var pushToList = this.client.lpush.bind(this.client, list, data);
	var updateMark = this._updateMark.bind(this, event_name);

	async.series([pushToList, updateMark],
		function(err, res) {
			self.client.publish(notification, Date.now());
			if (callback instanceof Function) callback();
		});

};



MessageQueue.prototype._drain = function(list, callback) {

	var last = true;
	var self = this;

	async.whilst(function() {
		return !!last;
	}, function(check) {
		self.client.lpop(list, function(err, res) {
			if (err) throw new Error(err);

			if (res !== null) callback(res);

			last = res;
			check(err, res)
		});
	});

};

MessageQueue.prototype.checkMark = function(event_name, callback) {
	var mark_name = 'mark-' + event_name;
	this.client.get(mark_name, callback);
};

MessageQueue.prototype._updateMark = function(event_name, callback) {
	var now = Date.now();
	var mark_name = 'mark-' + event_name;
	this.client.set(mark_name, now, callback)
};

MessageQueue.prototype._notificationName = function(name) {
	return 'new-' + name;
};

MessageQueue.prototype._listName = function(name) {
	return 'list-' + name;
};

module.exports = MessageQueue;
