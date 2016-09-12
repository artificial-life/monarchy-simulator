'use strict'

var inherits = require('util').inherits;

var Puppet = require('./classes/puppet.js');

//@NOTE: implements family relationships

function FamilyGuy() {

}

inherits(FamilyGuy, Puppet);


FamilyGuy.prototype.visitRelative = function() {

};

FamilyGuy.prototype.hostRelative = function() {

};

FamilyGuy.prototype._addToPedigree = function() {

};

FamilyGuy.prototype._correctPedigree = function() {
  //@NOTE: when relative dead
};

module.exports = FamilyGuy;
