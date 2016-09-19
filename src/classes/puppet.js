'use strict'

var MessageQueue = require('./message-queue.js');

//@NOTE: just util
function cammelCase(string) {
	var parts = string.split('-');
	var result = parts[0].toLowerCase();
	for (var i = 1; i < parts.length; i++) {
		var part = parts[i];
		result += part.charAt(0).toUpperCase() + part.slice(1);
	}
	return result;
}

//@NOTE: implements lifecycle actions

function Puppet(name, client) {
	this.name = name;
	this.client = client;
	this.queue = new MessageQueue(client, name);
	var self = this;

	this.queue.do('puppet-action', function (data, reply) {
		var action_name = cammelCase(data.action);
		var method = self[action_name];


		if (method instanceof Function) {
			method.call(self, reply);
			return;
		}

		reply('no such method', null);
	});
}

Puppet.prototype.die = function (callback) {
	callback(null, 500);
	setTimeout(function () {
		process.exit();
	}, 500)
};


Puppet.prototype.destroy = function () {
	this.queue.closeConnection();
	this.queue.unsubscribe();
};

module.exports = Puppet;
