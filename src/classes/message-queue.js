'use strict'

var redis = require('redis');
var async = require('async');
var _ = require('underscore');

var EventEmitter = require('events');
var inherits = require('util').inherits;

function MessageQueue(client, owner) {
	this.subscriber = client.duplicate();
	this.client = client;
	this.owner = owner;


	var self = this;
	this.subscriber.on("message", function (chanel, message) {
		self.emit(chanel, message);
	});

	this.subscriber.on('subscribe', function () {
		self.emit('subscribe');
	});


}

inherits(MessageQueue, EventEmitter);

/*Publishing patterns*/
MessageQueue.prototype.subscribe = function (event_name, callback) {
	this.subscriber.subscribe(event_name);
	this.on(event_name, callback);
};

MessageQueue.prototype.publish = function (event_name, data) {
	this.client.publish(event_name, data);
};

MessageQueue.prototype.request = function (worker, task, data, callback) {
	var message = {
		data: data,
		_task: task,
		_sender: this.name,
		id: //@GENERATE
	}

	this.command(request_list, JSON.stringify(message));
};

MessageQueue.prototype.do = function (task_name, callback) {
	var request_list = this._requestListName(task_name);
	var seld = this;

	this.act(request_list, function (message_string) {
		var message = JSON.parse(message_string);
		var data = message.data;

		var reply = self._makeReply(message);

		callback(data, reply);
	});
};



MessageQueue.prototype.act = function (event_name, callback) {
	var self = this;
	var notification = this._notificationName(event_name);
	var list = this._listName(event_name);
	var sink = this._drain.bind(this, list, callback);

	this.subscribe(notification, sink);
	sink()
};


MessageQueue.prototype.command = function (event_name, data, callback) {
	var notification = this._notificationName(event_name);
	var list = this._listName(event_name);
	var self = this;
	var pushToList = this.client.lpush.bind(this.client, list, data);
	var updateMark = this._updateMark.bind(this, event_name);

	async.series([pushToList, updateMark],
		function (err, res) {
			self.client.publish(notification, Date.now());
			if (callback instanceof Function) callback();
		});

};

MessageQueue.prototype.closeConnection = function () {
	this.subscriber.end(false);
};

/*Private*/


MessageQueue.prototype._drain = function (list, callback) {

	var last = true;
	var self = this;

	async.whilst(function () {
		return !!last;
	}, function (check) {
		self.client.lpop(list, function (err, res) {
			if (err) throw new Error(err);

			if (res !== null) callback(res);

			last = res;
			check(err, res)
		});
	});

};

MessageQueue.prototype.checkMark = function (event_name, callback) {
	var mark_name = 'mark-' + event_name;
	this.client.get(mark_name, callback);
};

MessageQueue.prototype._makeReply = function (message) {
	var task_name = message._task;
	var sender = message._sender;

	var response_list = this._responseListName(task_name, sender);
	var self = this;

	return function (data) {
		var data_string = _.isObject(data) ? JSON.stringify(data) : data;
		self.command(response_list, data_string);
	}
};

MessageQueue.prototype._updateMark = function (event_name, callback) {
	var now = Date.now();
	var mark_name = 'mark-' + event_name;
	this.client.set(mark_name, now, callback)
};

MessageQueue.prototype._notificationName = function (name) {
	return 'new-' + name;
};

MessageQueue.prototype._requestListName = function (action_name) {
	return ['request-list', this.owner, action_name].join('-');
};

MessageQueue.prototype._responseListName = function (task_name, recipient) {
	return ['response-list', recipient, action_name].join('-');
};




module.exports = MessageQueue;
MessageQueue;
