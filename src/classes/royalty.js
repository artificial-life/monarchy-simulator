'use strict'
var inherits = require('util').inherits;

var FamilyGuy = require('./family-guy.js');
var MessageQueue = require('./message-queue.js');


var ERROR_LIST = 'failed-orders';
//@NOTE: figths for the crown

function Royalty(name, client) {
  Royalty.super_.prototype.constructor.call(this, name, 'royal-family', client);
  var self = this;

  this.queue.act('royal-orders', function(msg) {
    if (self.commandHandler instanceof Function) self.commandHandler(msg, self.errorHandler);
  });
}

inherits(Royalty, FamilyGuy);

Royalty.prototype.onCommand = function(callback) {
  this.commandHandler = callback;
};

Royalty.prototype.errorHandler = function(error, msg) {
  if (!error) return;
  this.client.rpush(ERROR_LIST, msg);
};

Royalty.prototype.drainErrors = function() {
  var count = 0;
  this.queue.drain(ERROR_LIST, function() {
    count++
  }, function(err, res) {
    console.log('%d total errors drained', count);
  })
};

Royalty.prototype.relativeDead = function() {

};

Royalty.prototype.beCrowned = function() {

};




module.exports = Royalty;
