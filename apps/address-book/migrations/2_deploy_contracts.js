var App = artifacts.require('./AddressBook.sol')

module.exports = function (deployer) {
  deployer.deploy(App)
}
