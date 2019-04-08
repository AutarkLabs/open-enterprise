/**
 * https://github.com/aragon/aragonOS/blob/v4.0.0/truffle-config.js
 */
const homedir = require('homedir')
const path = require('path')

const HDWalletProvider = require('truffle-hdwallet-provider')
const HDWalletProviderPrivkey = require('truffle-hdwallet-provider-privkey')

const DEFAULT_MNEMONIC =
  'explain tackle mirror kit van hammer degree position ginger unfair soup bonus'

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

  if (!keys || keys.length === 0) {
    return new HDWalletProvider(mnemonic(), rpc)
  }

  return new HDWalletProviderPrivkey(keys, rpc)
}
module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
    mainnet: {
      network_id: 1,
      provider: providerForNetwork('mainnet'),
    },
    rinkeby: {
      network_id: 4,
      provider: providerForNetwork('rinkeby'),
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xffffffffff,
      gasPrice: 0x01,
    },
  },
}
