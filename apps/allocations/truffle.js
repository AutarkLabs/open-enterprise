var path = require('path');

module.exports = {
  contracts_build_directory: path.join(__dirname, './dist/contracts/'),
  networks: {
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
    }
  }
}
