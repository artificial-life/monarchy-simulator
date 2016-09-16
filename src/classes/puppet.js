'use strict'

var MessageQueue = require('./message-queue.js');

//@NOTE: implements lifecycle actions

function Puppet(name, client) {
	this.name = name;
	this.client = client;
	this.queue = new MessageQueue(client);
}

Puppet.prototype.die = function() {
	process.exit();
};


module.exports = Puppet;
