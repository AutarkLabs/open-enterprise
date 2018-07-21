var GithubRegistry = artifacts.require("./GithubRegistry.sol");

module.exports = function(deployer) {
  deployer.deploy(GithubRegistry);
};
