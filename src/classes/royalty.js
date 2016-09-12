'use strict'
var inherits = require('util').inherits;

var FamilyGuy = require('./classes/family-guy.js');
var MessageQueue = require('./message-queue.js');

//@NOTE: figths for the crown

function Royalty(name, client) {
  this.queue = new MessageQueue(client);
  this.client = client;
}

inherits(Royalty, FamilyGuy);

Royalty.prototype.relativeDead = function() {

};

Royalty.prototype.beCrowned = function() {

};


module.exports = Royalty;
