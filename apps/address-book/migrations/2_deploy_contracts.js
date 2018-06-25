var RangeVoting = artifacts.require('./RangeVoting.sol')

module.exports = function (deployer) {
  deployer.deploy(RangeVoting)
}
