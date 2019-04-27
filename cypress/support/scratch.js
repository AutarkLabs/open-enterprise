// additional providers and their configuration
/*
const ProviderEngine = require('truffle-privatekey-provider/node_modules/web3-provider-engine')
const CacheSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/filters.js')
const VmSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/vm.js')
const HookedWalletSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/hooked-wallet.js')
const NonceSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/nonce-tracker.js')
const RpcSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/rpc.js')

import * as Web3ProviderEngine  from 'truffle-privatekey-provider/node_modules/web3-provider-engine';
import * as RpcSource  from 'truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/rpc';

var engine = new ProviderEngine()
var web3 = new Web3(engine)

const prvProvider = new PrivateKeyProvider(
  "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
  "http://localhost:8545"
);

web3.setProvider(prvProvider)

// static results
engine.addProvider(new FixtureSubprovider({
  web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
  net_listening: true,
  eth_hashrate: '0x00',
  eth_mining: false,
  eth_syncing: true,
}))

// cache layer
engine.addProvider(new CacheSubprovider())

// filters
engine.addProvider(new FilterSubprovider())

// pending nonce
engine.addProvider(new NonceSubprovider())

// vm
engine.addProvider(new VmSubprovider())

// id mgmt
/*
engine.addProvider(new HookedWalletSubprovider({
  getAccounts: function(cb){ ... },
  approveTransaction: function(cb){ ... },
  signTransaction: function(cb){ ... },
}))
//*/
// data source
/*
engine.addProvider(new RpcSubprovider({
  rpcUrl: 'http://localhost:8545',
}))

// log new blocks
engine.on('block', function(block){
  console.log('================================')
  console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
  console.log('================================')
})

// network connectivity error
engine.on('error', function(err){
  // report connectivity errors
  console.error(err.stack)
})

// start polling for blocks
engine.start()
*/
