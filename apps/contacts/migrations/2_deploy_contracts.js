var Contacts = artifacts.require('./Contacts.sol')

module.exports = function (deployer) {
  deployer.deploy(Contacts)
}
