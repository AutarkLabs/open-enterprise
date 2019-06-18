const StandardBounties = artifacts.require("../contacts/StandardBounties.sol");
const BountiesMetaTxRelayer = artifacts.require("../contracts/BountiesMetaTxRelayer.sol")

module.exports = function(deployer) {
  console.log('test')
  deployer.deploy(StandardBounties)
  .then(instance => {
    console.log(instance.address )
    return instance.address
  })
  .then( bountiesAddress => 
  deployer.deploy(BountiesMetaTxRelayer, bountiesAddress)
  .then(instance => console.log(instance.address ))
  )
};
