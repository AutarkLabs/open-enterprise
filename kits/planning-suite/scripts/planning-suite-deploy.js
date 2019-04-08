// const deployKit = require('@aragon/kits-beta-base/scripts/deploy_kit.js')
const deployKit = require('./deploy_kit.js')

// Make sure that you have deployed ENS and APM and that you set the first one
// in `ENS` env variable
module.exports = async callback => {
  const environment = process.argv[4]
  const network = environment === 'default' ? 'rpc' : 'rinkeby'
  const deployConfig = {
    artifacts,
    kitName: 'planning-suite',
    kitContractName: 'PlanningSuite',
    // returnKit: true,
    network: network,
  }

  console.log('deployConfig:', network)
  const { address } = await deployKit(null, deployConfig)

  console.log(address)
  callback()
}
