var path = require('path')

const mochaGasSettings = {
  reporter: 'eth-gas-reporter',
  reporterOptions: {
    currency: 'USD',
    gasPrice: 3,
  },
}

const mocha = process.env.GAS_REPORTER ? mochaGasSettings : {}

module.exports = {
  contracts_build_directory: path.join(__dirname, './build/contracts/'),
  networks: {
    rpc: {
      network_id: 15,
      host: 'localhost',
      port: 8545,
      gas: 6.9e6,
    },
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 7984452, // Block Gas Limit same as latest on Mainnet https://ethstats.net/
      gasPrice: 2000000000, // same as latest on Mainnet https://ethstats.net/
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
  },
  build: {},
  mocha,
}
