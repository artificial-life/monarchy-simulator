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

	it('can pub\sub messages', function(next) {
		var event = 'random-event-' + Math.random().toString().slice(2, 20);
		var subscriber = new MessageQueue(redis.createClient());
		var int = false;
		var counter = 0;

		subscriber.subscribe(event, function(message) {
			counter++;
			if (counter == 5) {
				clearInterval(int);
				subscriber.closeConnection();
				next();
			}
		});

		subscriber.on('subscribe', function() {
			int = setInterval(function() {
				mq.publish(event, Math.random());
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
			mq.publish(event, write, function() {
				write++;
				cb(null, write)
			})
		}, function(err, res) {
			mq.subscribe(event, function(data) {
				read++;
				if (10 == read) {
					next();
				}
			});
		});


	});


	it('test', function() {

	});
});
