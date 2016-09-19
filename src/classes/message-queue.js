'use strict'

var redis = require('redis');
var async = require('async');
var _ = require('underscore');

var EventEmitter = require('events');
var inherits = require('util').inherits;

/*const section*/
var POOL_SIZE = 10; //@NOTE: this pretty safe in our case
var MARK_EXPIRATION = 3000; //@NOTE: value in seconds
var DEFAULT_TIMEOUT = 1500; //@NOTE: in msec

function MessageQueue(client, owner) {
	this.subscriber = client.duplicate();
	this.client = client;
	this.owner = owner;

	//@NOTE: just simple awaiting request pool implementation
	//@TODO: implement timeout
	this.request_pool = [];
	this.timeout_pool = [];
	this.request_counter = 0;

	var self = this;
	this.subscriber.on("message", function (chanel, message) {
		self.emit(chanel, message);
	});

	this.subscriber.on('subscribe', function (chanel) {
		self.emit('subscribe', chanel);
	});

	var response_list = this._responseListName(owner);

	this.act(response_list, (data_string) => {
		var message = JSON.parse(data_string);
		var id = message.id;

		self._resolveRequest(id, message.err, message.data);
	})
}

inherits(MessageQueue, EventEmitter);

/*Publishing patterns*/
MessageQueue.prototype.subscribe = function (event_name, callback) {
	this.subscriber.subscribe(event_name);
	this.on(event_name, callback);
};

MessageQueue.prototype.unsubscribe = function (event_name, callback) {
	this.subscriber.unsubscribe(event_name);
	this.removeAllListeners(event_name);
};

MessageQueue.prototype.publish = function (event_name, data) {
	this.client.publish(event_name, data);
};

MessageQueue.prototype.request = function (path, data, callback, timeout) {
	var part = path.split('://');
	var worker = part[0];
	var task = part[1];

	var counter = this._createRequest(callback, timeout);

	var message = {
		data: data,
		_task: task,
		_sender: this.owner,
		id: counter
	};
	var request_list = this._requestListName(task, worker);

	this.command(request_list, JSON.stringify(message));
};

MessageQueue.prototype.do = function (task_name, callback) {
	var request_list = this._requestListName(task_name);
	var self = this;

	this.act(request_list, function (message_string) {
		var message = JSON.parse(message_string);
		var data = message.data;

		var reply = self._makeReply(message);

		callback(data, reply);
	});
};

MessageQueue.prototype.act = function (event_name, callback) {
	var notification = this._notificationName(event_name);
	var list = this._listName(event_name);
	var sink = this.drain.bind(this, list, callback);

	this.subscribe(notification, sink);
	sink();
};

MessageQueue.prototype.unact = function (event_name) {
	var notification = this._notificationName(event_name);
	this.unsubscribe(notification);
};

MessageQueue.prototype.command = function (event_name, data, callback) {
	var notification = this._notificationName(event_name);
	var list = this._listName(event_name);
	var self = this;
	var pushToList = this.client.rpush.bind(this.client, list, data);
	var updateMark = this._updateMark.bind(this, event_name);

	async.series([pushToList, updateMark],
		function (err, res) {
			self.client.publish(notification, Date.now());
			if (callback instanceof Function) callback();
		});

};



MessageQueue.prototype.closeConnection = function () {
	this.subscriber.unsubscribe();
	this.subscriber.end(false);
};

MessageQueue.prototype.drain = function (list, callback, drainend) {
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
	}, function (err, res) {
		if (drainend instanceof Function) drainend(err, res)
	});

};

MessageQueue.prototype.checkMark = function (event_name, isdiff, callback) {
	var mark_name = 'mark-' + event_name;
	if (!isdiff) {
		//@NOTE: just get it
		this.client.get(mark_name, callback);
		return;
	}

	var self = this;

	async.parallel({
		current: function (cb) {
			self.client.time(cb)
		},
		mark: function (cb) {
			self.client.get(mark_name, cb)
		}
	}, function (err, results) {
		if (err) {
			callback(err, null)
			return;
		}

		var current = results.current;
		var now = current[0] * 1000 + (current[1] / 1000 | 0);
		var diff = now - results.mark;

		callback(null, diff);
	});
};

/*Private*/

MessageQueue.prototype._makeReply = function (message) {
	var sender = message._sender;

	var response_list = this._responseListName(sender);
	var self = this;

	return function (err, data) {
		var response = {
			id: message.id,
			_task: message._task,
			_sender: self.owner
		};

		response.err = err ? err : false;

		if (!err) {
			response.data = data;
		}

		var data_string = JSON.stringify(response);
		self.command(response_list, data_string);
	}
};

MessageQueue.prototype._createRequest = function (callback, timeout) {
	var self = this;
	//@NOTE: rotating id
	var fresh_id = (this.request_counter + 1) % POOL_SIZE;
	this.request_counter = fresh_id;
	timeout = _.isNumber(timeout) ? timeout : DEFAULT_TIMEOUT;

	if (this.request_pool[fresh_id] instanceof Function) {
		//@NOTE: yeap, it's really bad news, should throw big fat error
		//@NOTE: real request object should provide more infromation
		//@NOTE: so, don't use timeout == 0 without strong reason
		throw new Error('Something goes wrong; #' + fresh_id + ' still not fullfiled');
	}

	if (timeout) {

		var timeout_id = setTimeout(function () {
			self._resolveRequest(fresh_id, 'timeout', null);
		}, timeout);
		this.timeout_pool[fresh_id] = timeout_id;
	}

	this.request_pool[fresh_id] = callback;


	return fresh_id;
}

MessageQueue.prototype._resolveRequest = function (id, err, data) {
	var typed_id = parseInt(id, 10); //@NOTE: not really needed, but i feel much safer now
	var callback = this.request_pool[typed_id];
	var timeout_id = this.timeout_pool[typed_id];

	timeout_id && clearTimeout(timeout_id);

	if (callback instanceof Function) {
		callback(err, data);
		this.request_pool[typed_id] = null;
	}
}

MessageQueue.prototype._listName = function (name) {
	return 'list-' + name;
};


//@NOTE: not necessary, but good for testing
MessageQueue.prototype._updateMark = function (event_name, callback) {

	var mark_name = 'mark-' + event_name;
	var self = this;

	async.waterfall([
		function (cb) {
			self.client.time(cb);
		},
		function (time, cb) {
			var now = time[0] * 1000 + (time[1] / 1000 | 0);
			self.client.set(mark_name, now, cb);
		},
		function (state, cb) {
			self.client.expire(mark_name, MARK_EXPIRATION, cb);
		}
	], callback);

};

MessageQueue.prototype._notificationName = function (name) {
	return 'new-' + name;
};

MessageQueue.prototype._requestListName = function (task_name, worker) {
	var who = worker || this.owner;
	return ['request-list', who, task_name].join('-');
};

MessageQueue.prototype._responseListName = function (recipient) {
	return ['response-list', recipient].join('-');
};


module.exports = MessageQueue;
