'use strict'

var redis = require('redis');

var FamilyGuy = require('../src/classes/family-guy.js');
var MessageQueue = require('../src/classes/message-queue.js');

describe('Family Guy', function() {
	var fg;
	var client = redis.createClient();
	var family_name = 'family';

	beforeEach(function(ready) {
		client.del(family_name, function() {
			fg = new FamilyGuy('me', family_name, client, ready);
		});
	});


	it('single guy has no relative', function(next) {
		fg.visitRelative(function(err, res) {
			expect(err).to.be.equal('nothing to ping');
			next();
		})
	});

	it('visit relative', function(next) {
		var second = new FamilyGuy('other-guy', family_name, client);

		setTimeout(function() {
			// var args1 = [family_name, '+inf', '-inf', 'WITHSCORES'];
			//
			// client.zrevrangebyscore(args1, function(err, response) {
			// 	console.log('family', response);
			// });

			fg.visitRelative(function(err, res) {
				expect(res).to.have.property('status', 'alive');
				second.destroy();
				next();
			})
		}, 100);

	});

	it('test', function() {
		var second = new FamilyGuy('other-guy', family_name, client);
		second.relativeStatusHandler(function(err, res) {
			console.log('SECOND', err, res);
		});

		fg.relativeStatusHandler(function(err, res) {
			console.log('FIRST', err, res);
		});
	})

})
