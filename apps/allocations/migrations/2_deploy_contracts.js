var Allocations = artifacts.require('./Allocations.sol')

module.exports = function (deployer) {
  deployer.deploy(Allocations)
}
