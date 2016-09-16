'use strict'

var Service = require('../src/classes/royalty.js');
var redis = require('redis');
var MessageQueue = require('../src/classes/message-queue.js');

describe('Service', function() {
	var service;
	beforeEach(function() {
		service = new Service('me', redis.createClient());
	});

	it('creates message queue', function() {
		expect(service.queue).to.be.instanceof(MessageQueue);
	})

	it('test', function() {

	})
})
