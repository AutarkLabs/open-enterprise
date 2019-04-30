const homedir = require('homedir')
const path = require('path')

const HDWalletProvider = require('truffle-hdwallet-provider')
const HDWalletProviderPrivkey = require('truffle-hdwallet-provider-privkey')

const DEFAULT_MNEMONIC =
  'explain tackle mirror kit van hammer degree position ginger unfair soup bonus'

const mochaGasSettings = {
  reporter: 'eth-gas-reporter',
  reporterOptions: {
    currency: 'USD',
    gasPrice: 3,
  },
}
const mocha = process.env.GAS_REPORTER ? mochaGasSettings : {}

const defaultRPC = network => `https://${network}.infura.io`

const configFilePath = filename => path.join(homedir(), `.aragon/${filename}`)

const mnemonic = () => {
  try {
    return require(configFilePath('mnemonic.json')).mnemonic
  } catch (e) {
    return DEFAULT_MNEMONIC
  }
}

const settingsForNetwork = network => {
  try {
    return require(configFilePath(`${network}_key.json`))
  } catch (e) {
    return {}
  }
}

// Lazily loaded provider
const providerForNetwork = network => () => {
  let { rpc, keys } = settingsForNetwork(network)
  rpc = rpc || defaultRPC(network)

  if (!keys || keys.length == 0) {
    return new HDWalletProvider(mnemonic(), rpc)
  }

  return new HDWalletProviderPrivkey(keys, rpc)
}

module.exports = {
  // contracts_build_directory: path.join(__dirname, './build/contracts/'),
  networks: {
    rpc: {
      network_id: 15,
      host: 'localhost',
      port: 8545,
      gas: 8.2e6,
    },
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 8.2e6,
      gasPrice: 2000000000, // same as latest on Mainnet https://ethstats.net/
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    rinkeby: {
      network_id: 4,
      provider: providerForNetwork('rinkeby'),
      gasPrice: 6000000000,
    },
    mainnet: {
      network_id: 1,
      provider: providerForNetwork('mainnet'),
    },
  },
  build: {},
  mocha,
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    },
  },
}
