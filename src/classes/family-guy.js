'use strict'

var VISIT_INTERVAL = 2000; //@NOTE: msec

var inherits = require('util').inherits;

var Puppet = require('./puppet.js');
var Pedigree = require('./pedigree.js');

//@NOTE: implements family relationships

function FamilyGuy(name, family, client) {
  FamilyGuy.super_.prototype.constructor.call(this, name, client);
  this.pedigree = new Pedigree(family, client);

  this.pedigree.add(name, function() {

  });

  var self = this;

  this.visit = setInterval(function() {
    self.visitRelative(self.relativeStatus);
  }, VISIT_INTERVAL);
}

inherits(FamilyGuy, Puppet);

FamilyGuy.prototype.relativeStatusHandler = function(callback) {
  this.relativeStatus = callback;
};

FamilyGuy.prototype.visitRelative = function(callback) {
  this.pedigree.getRelative(function(err, res) {
    if (err) throw new Error(err);
    if (res == null) {

      return;
    }

  })
};

FamilyGuy.prototype.hostRelative = function() {

};

FamilyGuy.prototype._addToPedigree = function() {

};

FamilyGuy.prototype._correctPedigree = function() {
  //@NOTE: when relative dead
};

module.exports = FamilyGuy;
