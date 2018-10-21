// module.exports = require("@aragon/os/truffle-config")
const HDWalletProvider = require('truffle-hdwallet-provider')
const HDWalletProviderPrivkey = require('truffle-hdwallet-provider-privkey')
const path = require('path')

let mnemonic
try {
  mnemonic = require(require('homedir')() + '/.aragon/mnemonic.json').mnemonic
} catch (e) {
  mnemonic =
    'stumble story behind hurt patient ball whisper art swift tongue ice alien'
}

let ropstenProvider = {}
let kovanProvider = {}
let rinkebyProvider = {}

if (process.env.LIVE_NETWORKS) {
  ropstenProvider = new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/')
  kovanProvider = new HDWalletProvider(mnemonic, 'https://kovan.infura.io')

  try {
    const { rpc, keys } = require(require('homedir')() +
      '/.aragon/rinkebykey.json')
    rinkebyProvider = new HDWalletProviderPrivkey(keys, rpc)
  } catch (e) {
    rinkebyProvider = new HDWalletProvider(
      mnemonic,
      'https://rinkeby.infura.io'
    )
  }
}

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
