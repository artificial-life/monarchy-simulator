'use strict'

//@NOTE: implements lifecycle actions

function Puppet() {

}

Puppet.prototype.die = function() {
  process.exit();
};


module.exports = Puppet;
