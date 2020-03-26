const StandardBounties = artifacts.require("../contacts/StandardBounties.sol");

module.exports = function(deployer) {
  deployer.deploy(StandardBounties)
  .then(instance => {
    console.log(instance.address )
  })
};
