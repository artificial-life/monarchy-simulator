'use strict'

//@NOTE: ...of thrones (.)(.) - like seen on HBO

var redis = require('redis');
var async = require('async');
var child_process = require('child_process');

var MessageQueue = require('../src/classes/message-queue.js');

var client = redis.createClient();
var queue = new MessageQueue(client, 'game-master');

var heroes = [];

child_process.fork('./src/index.js', ['--name', 'me']);
child_process.fork('./src/index.js', ['--name', 'other-guy']);

queue.request('me://puppet-action', {
	action: 'be-king'
}, function (err, res) {
	console.log(err, res);
})

setTimeout(function () {
	queue.request('me://puppet-action', {
		action: 'drain-errors'
	}, function (err, res) {
		console.log(err, res);
	})
}, 10000);
