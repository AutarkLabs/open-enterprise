var StandardBounties = artifacts.require("../contacts/StandardBounties.sol");

module.exports = function(deployer) {
  console.log('test')
  deployer.deploy(StandardBounties);
  console.log('test after')
};
