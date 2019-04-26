const PrivateKeyProvider = require ("truffle-privatekey-provider")
/*import Web3 from "@aragon/wrapper/node_modules/web3";

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


const KEY1 = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
const KEY2 = '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb'
const ACC1 = 'Account 1'
const ALLOC1 = 'Allocation 3'
/*
const provider1 = new PrivateKeyProvider(
  "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
  "http://localhost:8545"
);

const provider2 = new PrivateKeyProvider(
  "ce8e3bda3b44269c147747a373646393b1504bfcbb73fc9564f5d753d8116608",
  "http://localhost:8545"
);
*/
/*
cy.on("window:before:load", (win) => {
  const provider = new PrivateKeyProvider(provider1);
  win.web3 = new Web3(provider); // eslint-disable-line no-param-reassign
});
*/
context('Aragon', () => {
  before(() => {
    cy.on("window:before:load", (win) => {
      const provider = new PrivateKeyProvider(
        "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
        "http://localhost:8545"
      );
/*     
      win.web3 = web3; //new Web3(provider);
//      var ver = win.web3.version.api;
      console.log(ver); // 493736
      var x = win.web3.utils.asciiToHex('test')
      console.log(x)
      */
    });
    cy.visit('http://localhost:3000/#/0x5b6a3301a67A4bfda9D3a528CaD34cac6e7F8070')


  })
////////////////////////////////////////////////////////////////////////////////////////
// Allocations
////////////////////////////////////////////////////////////////////////////////////////
  context('Allocations', () => {
    ////////////////////////////////////////////////////////////////////////////////////////
    // new account
    ////////////////////////////////////////////////////////////////////////////////////////
    it('creates New Account', () => {
      cy.on('uncaught:exception', (err, runnable) => {
        expect(err.message).to.include('convertible string')
        console.log('uncaught')
        //done()
        return false
      })

      cy.contains('span', 'Allocations', { timeout: 150000 }).wait(1000).click()
      .get('iframe').iframe().contains('button','New Account').click().wait(1000)
      .get('iframe').iframe().find('textarea[name="description"]').type(ACC1)
      .get('iframe').iframe().contains('button','Create Account').click().wait(1000)

      cy.contains('button','Create transaction').click()
      cy.contains('button','Close').click().wait(3000)

      cy.get('iframe').iframe().contains('div', ACC1)
    })
    ////////////////////////////////////////////////////////////////////////////////////////
    // new allocation
    ////////////////////////////////////////////////////////////////////////////////////////
    it('creates New Allocation', () => {

      cy.on('uncaught:exception', (err, runnable) => {
        expect(err.message).to.include('convertible string')
        console.log('uncaught')
        return false
      })

      cy.contains('span', 'Allocations', { timeout: 150000 }).wait(1000).click()
      .get('iframe').iframe().wait(1000).find('div').each((el) => {

        if (/ContextMenu__BaseButton/.test(el[0].className)) {
          //console.log('--', el[0].className)
          el[0].click()
        }
      }
      ).wait(1000)
      .get('iframe').iframe().contains('span', 'New Allocation', { timeout: 150000 }).click({force: true})
      .get('iframe').iframe().find('textarea[name="allocationDescription"]').type(ALLOC1)
      .get('iframe').iframe().find('input[name="amount"]').type('13')
      .get('iframe').iframe().wait(1000).find('div').each((el) => {

        if (/DropDown__DropDownActiveItem/.test(el[0].className)) {
          //console.log('--', el[0].className)
          el[0].click()
        }
      }
      ).wait(1000)
      .get('iframe').iframe().contains('div','autark').click().wait(200)
      .get('iframe').iframe().find('input[placeholder="Enter an address option"]').type(KEY1)
      .get('iframe').iframe().contains('button','+ Add option').click().wait(200)
      .get('iframe').iframe().find('input[placeholder="Enter an address option"]').type(KEY2)
      .get('iframe').iframe().contains('button','Submit Allocation').click().wait(200)

      cy.contains('button','Create transaction').click()
      cy.contains('button','Close').click()
    })
  })
})

