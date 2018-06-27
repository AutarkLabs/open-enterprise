var PayoutEngine = artifacts.require('./PayoutEngine.sol')

module.exports = function (deployer) {
  deployer.deploy(PayoutEngine)
}
