'use strict'

var MessageQueue = require('./message-queue.js');

//@NOTE: implements lifecycle actions

function Puppet(name, client) {
	this.name = name;
	this.client = client;
	this.queue = new MessageQueue(client, name);
}

Puppet.prototype.die = function() {
	process.exit();
};

Puppet.prototype.destroy = function() {
	this.queue.closeConnection();
};

module.exports = Puppet;
