'use strict'

var redis = require('redis');

var Royalty = require('../src/classes/royalty.js');
var MessageQueue = require('../src/classes/message-queue.js');

describe('Royalty', function () {
	var royalty;
	var client = redis.createClient();
	var family_name = 'royal-family';
	var myName = 'Me The Greate';

	beforeEach(function (ready) {
		client.del(family_name, function () {
			royalty = new Royalty(myName + Date.now(), client, ready);
			royalty.queue.act('royal-orders', function (err, res) {
				console.log('ORDERS', err, res);
			})
		});
	});

	describe('beKing', function () {

		it('takes the throne', function (cb) {
			royalty.beKing(function () {
				client.get('royal-family-king', function (err, resp) {
					expect(resp).to.be.equal(royalty.name);
					cb();
				})
			})
		});

		it('king is just a puppet', function (cb) {
			var queue = new MessageQueue(client, 'master');

			queue.request(royalty.name + '://puppet-action', {
				action: 'be-king'
			}, function (err, res) {
				cb(err)
			})
		});

	});


	afterEach(function () {
		royalty.destroy();
	})
})
