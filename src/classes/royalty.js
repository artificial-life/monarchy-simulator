'use strict'
var inherits = require('util').inherits;

var FamilyGuy = require('./family-guy.js');
var MessageQueue = require('./message-queue.js');

//@NOTE: figths for the crown

function Royalty(name, client) {
	Royalty.super_.prototype.constructor.call(this, name, client);
	// this.queue = new MessageQueue(client,name);
	// this.client = client;
}

inherits(Royalty, FamilyGuy);

Royalty.prototype.relativeDead = function() {

};

Royalty.prototype.beCrowned = function() {

};


module.exports = Royalty;
