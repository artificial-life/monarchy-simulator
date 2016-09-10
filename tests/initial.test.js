'use strict'

var redis = require("redis");
var client = redis.createClient();

describe('initial', function() {
	it('Redis Ready', function(next) {
		client.on("error", function(err) {
			next(new Error(err))
		});

		client.set("string key", "string val", function() {
			next()
		});
	})
});
