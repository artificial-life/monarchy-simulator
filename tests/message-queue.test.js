'use strict'

var EventEmitter = require('events');
var redis = require('redis');
var async = require('async');

var MessageQueue = require('../src/classes/message-queue.js');

describe('MessageQueue', function() {
	var mq;
	var client = redis.createClient();
	beforeEach(function() {
		mq = new MessageQueue(client, 'main');
	})

	afterEach(function() {
		mq.closeConnection();
	})

	it('is instanceof EventEmitter', function() {
		expect(mq).to.be.an.instanceof(EventEmitter)
	});

	it('can command/act messages', function(next) {
		var event = 'random-event-' + Math.random().toString().slice(2, 20);
		var subscriber = new MessageQueue(redis.createClient());
		var int = false;
		var counter = 0;

		subscriber.act(event, function(message) {
			counter++;
			if (counter == 5) {
				clearInterval(int);
				subscriber.closeConnection();
				next();
			}
		});

		subscriber.on('subscribe', function(channel) {

			if (channel != 'new-' + event) return;

			int = setInterval(function() {
				mq.command(event, Math.random());
			}, 30);
		});

	});


	it(' drain only', function(next) {
		var event = 'drain-list';
		var read = 0;
		var write = 0;
		var push_count = 100;

		async.whilst(function() {
			return write != push_count
		}, function(cb) {

			mq.client.rpush(event, write, function() {
				write++;
				cb(null, write)
			})
		}, function(err, res) {

			mq.drain(event, function(data) {
				read++;
			}, function() {
				if (push_count == read) next();
			});

		});
	});

	it('can drain all messages', function(next) {
		var event = 'drain-event';
		var read = 0;
		var write = 0;

		async.whilst(function() {
			return write != 10
		}, function(cb) {
			mq.command(event, write, function() {
				write++;
				cb(null, write)
			})
		}, function(err, res) {
			mq.act(event, function(data) {
				read++;

				if (10 == read) {
					next();
				}
			});
		});
	});


	it('can pub/sub', function(next) {
		var subscriber = new MessageQueue(redis.createClient());
		var data_to_send = Math.random().toString();
		subscriber.subscribe('event', (data) => {

			subscriber.closeConnection();

			expect(data).to.be.equal(data_to_send);
			next();
		});
		subscriber.on('subscribe', (data) => {
			data == 'event' && mq.publish('event', data_to_send);
		})
	});

	it('its real pub/sub', function(next) {
		var subscriber = new MessageQueue(redis.createClient());
		var subscriber2 = new MessageQueue(redis.createClient());
		var data_to_send = Math.random().toString();
		var count = 0;
		var subscribes = 0;

		function receiver(data) {
			count++;
			expect(data).to.be.equal(data_to_send);

			if (count == 2) {
				next();
				subscriber.closeConnection();
				subscriber2.closeConnection();
			}
		};

		function starter(ch) {
			if (ch != 'event') return;
			subscribes++;
			(subscribes == 2) && mq.publish('event', data_to_send);
		}

		subscriber.on('subscribe', starter)
		subscriber2.on('subscribe', starter)

		subscriber.subscribe('event', receiver);
		subscriber2.subscribe('event', receiver);


	});

	it('request response success', function(next) {
		var response = new MessageQueue(redis.createClient(), 'xxx');
		var number = 100;

		var action = function(data) {
			return data * 2
		};

		response.do('task', function(data, reply) {
			reply(null, action(data));
		});

		mq.request('xxx://task', number, function(err, res) {
			expect(res).to.be.equal(action(number))
			next();
			response.closeConnection();
		})
	});

	it('request response can fail', function(next) {
		var response = new MessageQueue(redis.createClient(), 'zzz');
		var error = 'because i can';
		response.do('task', function(data, reply) {
			reply(error);
		});

		mq.request('zzz://task', 'why?', function(err, res) {
			expect(err).to.be.equal(error);
			expect(res).to.be.equal(undefined);
			next();
			response.closeConnection();
		})
	});

	it('request response targeted', function(next) {
		var response = new MessageQueue(redis.createClient(), 'xxx');
		var response2 = new MessageQueue(redis.createClient(), 'xxx-zzz');
		var number = 100;

		response.do('task', function(data, reply) {
			reply(null, data);
		});

		response2.do('task', function(data, reply) {
			next(new Error('i should not get it!'))
		});

		mq.request('xxx://task', number, function(err, res) {
			expect(res).to.be.equal(number);
			next();
			response.closeConnection();
			response2.closeConnection();
		})
	});

	it('mark diff', function(next) {
		//@TODO: should rework this synthetic test
		mq.checkMark('drain-event', true, function(err, res) {
			expect(res).to.be.below(1000);
			next();
		});
	})


	after(function() {
		client.end(false);
	});
});
