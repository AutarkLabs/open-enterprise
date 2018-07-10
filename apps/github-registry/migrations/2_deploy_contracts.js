var App = artifacts.require('./GithubRegistry.sol')

module.exports = function (deployer) {
  deployer.deploy(App)
}
