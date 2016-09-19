'use strict'

var redis = require('redis');
var Pedigree = require('../src/classes/pedigree.js');


describe('Pedigree', function() {
	var client = redis.createClient();
	var pedigree;
	var family_name = 'test-family';

	beforeEach(function(cb) {
		client.del(family_name, function() {
			pedigree = new Pedigree(family_name, client);
			cb();
		})
	});

	it('add', function(cb) {
		var args1 = [family_name, '+inf', '-inf'];

		pedigree.add('me', function(err, res) {
			pedigree.add('you', function(err, res) {
				//@NOTE: welcome to callback hell
				client.zrevrangebyscore(args1, function(err, response) {
					expect(response).to.have.length(2);
					cb(err);
				});
			});

		});

	});

	it('getRelative', function(cb) {
		pedigree.add('me', function(err, res) {
			pedigree.add('you', function(err, res) {

				pedigree.getRelative(function(err, res) {
					expect(res).to.be.have.property('name', 'me');
					cb(err);
				});

			});
		});

	});

	it('getLast', function(cb) {
		pedigree.add('me', function(err, res) {
			pedigree.add('you', function(err, res) {

				pedigree.getLast(function(err, res) {
					expect(res).to.be.have.property('name', 'you');
					cb(err);
				});

			});
		});

	});

	it('exclude', function(cb) {
		pedigree.add('me', function(err, res) {
			pedigree.exclude(res, function(err, res) {
				expect(res).to.be.equal(1); //@TODO: must do better checks here
				cb();
			})
		});
	});

	after(function() {
		client.end(false);
	});
})
