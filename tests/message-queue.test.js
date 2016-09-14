'use strict'

var EventEmitter = require('events');
var redis = require('redis');
var async = require('async');

var MessageQueue = require('../src/classes/message-queue.js');

describe('MessageQueue', function() {
	var mq;

	beforeEach(function() {
		mq = new MessageQueue(redis.createClient());
	})

	afterEach(function() {
		mq.closeConnection();
	})

	it('is instanceof EventEmitter', function() {
		expect(mq).to.be.an.instanceof(EventEmitter)
	});

	it('can command\act messages', function(next) {
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

		subscriber.on('subscribe', function() {
			int = setInterval(function() {
				mq.command(event, Math.random());
			}, 30);
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


	it('can pub\sub', function(next) {
		var subscriber = new MessageQueue(redis.createClient());
		var data_to_send = Math.random().toString();
		subscriber.subscribe('event', (data) => {

			subscriber.closeConnection();

			expect(data).to.be.equal(data_to_send);
			next();
		});
		subscriber.on('subscribe', () => {
			mq.publish('event', data_to_send);
		})
	});

	it('its real pub\sub', function(next) {
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

		function starter() {
			subscribes++;
			(subscribes == 2) && mq.publish('event', data_to_send);
		}

		subscriber.on('subscribe', starter)
		subscriber2.on('subscribe', starter)

		subscriber.subscribe('event', receiver);
		subscriber2.subscribe('event', receiver);


	});

	it('test', function() {

	});
});
