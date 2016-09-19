'use strict'

var redis = require('redis');

var Royalty = require('../src/classes/royalty.js');
var MessageQueue = require('../src/classes/message-queue.js');

describe('Royalty', function() {
	var royalty;
	var client = redis.createClient();
	var family_name = 'royal-family';
	var myName = 'Me The Greate';

	beforeEach(function(ready) {
		client.del(family_name, function() {
			royalty = new Royalty(myName, client, ready);
			royalty.queue.act('royal-orders', function(err, res) {
				console.log(err, res);
			})
		});
	});

	describe('beKing', function() {

		it('takes the throne', function(cb) {
			royalty.beKing(function() {
				client.get('royal-family-king', function(err, resp) {
					expect(resp).to.be.equal(myName);
					cb();
				})
			})
		});

	})
})
