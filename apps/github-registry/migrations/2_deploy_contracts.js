<<<<<<< HEAD
var RangeVoting = artifacts.require('./RangeVoting.sol')
=======
var App = artifacts.require('./GithubRegistry.sol')
>>>>>>> upstream/111-github-registry

module.exports = function (deployer) {
  deployer.deploy(RangeVoting)
}
