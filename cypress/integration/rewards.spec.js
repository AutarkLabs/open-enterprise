import Web3 from "@aragon/wrapper/node_modules/web3";
const PrivateKeyProvider = require ("truffle-privatekey-provider")

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

engine.addProvider(new FixtureSubprovider({
  web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
  net_listening: true,
  eth_hashrate: '0x00',
  eth_mining: false,
  eth_syncing: true,
}))

engine.addProvider(new CacheSubprovider())
engine.addProvider(new FilterSubprovider())
engine.addProvider(new NonceSubprovider())
engine.addProvider(new VmSubprovider())

// id mgmt
/*
engine.addProvider(new HookedWalletSubprovider({
  getAccounts: function(cb){ ... },
  approveTransaction: function(cb){ ... },
  signTransaction: function(cb){ ... },
}))
*/
// data source
engine.addProvider(new RpcSubprovider({
  rpcUrl: 'http://localhost:8545',
}))

engine.on('block', function(block){
  console.log('================================')
  console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
  console.log('================================')
})

engine.on('error', function(err){
  console.error(err.stack)
})

engine.start()

const user1 = new PrivateKeyProvider(
  "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
  "http://localhost:8545"
);

const user2 = new PrivateKeyProvider(
  "ce8e3bda3b44269c147747a373646393b1504bfcbb73fc9564f5d753d8116608",
  "http://localhost:8545"
);
/*
cy.on("window:before:load", (win) => {
  const provider = new PrivateKeyProvider(provider1);
  win.web3 = new Web3(provider); // eslint-disable-line no-param-reassign
});
*/
context('Aragon', () => {
  before(() => {
    cy.on("window:before:load", (win) => {

      /*
      const provider = new PrivateKeyProvider(
        "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
        "http://localhost:8545"
      );
      */
      win.web3 = web3; //new Web3(provider);
      console.log(web3.version.api);
      var x = win.web3.utils.asciiToHex('test')
      console.log(x)
    });
    cy.visit('http://localhost:3000/#/0x5b6a3301a67A4bfda9D3a528CaD34cac6e7F8070')
  })

////////////////////////////////////////////////////////////////////////////////////////
// new account
////////////////////////////////////////////////////////////////////////////////////////

///*
  context('Rewards', () => {
    it('creates New Reward', () => {
/*
      cy.on('uncaught:exception', (err, runnable) => {
        expect(err.message).to.include('convertible string')
        console.log('uncaught')
        //done()
        return false
      })
*/

      const tomorrow = new Date() + 1;

      cy.contains('span', 'Rewards', { timeout: 150000 }).click().wait(4000)

      .get('iframe').iframe().contains('button','New Reward').click().wait(1000)
      .get('iframe').iframe().find('input[name="description"]').type("Some Reward")
      .get('iframe').iframe().find('input[name="amount"]').type(3)
      .get('iframe').iframe().wait(1000).find('div').each((el) => {

        if (/DropDown__DropDownActiveItem/.test(el[0].className)) {
          //console.log('--', el[0].className)
          el[0].click()
        }
      }
      ).wait(1000)
      .get('iframe').iframe().contains('div','autark').click().wait(1000)
      .get('iframe').iframe().find('input[name="periodEnd"]').type('X{del}X' + tomorrow + 'X{enter}X')

      /*
      .get('iframe').iframe().contains('button','Create Account').click().wait(1000)

      cy.contains('button','Create transaction').click()
      cy.contains('button','Close').click().wait(3000)

      cy.get('iframe').iframe().contains('div', ACC1)
      */
    })
  })
//*/
})
////////////////////////////////////////////////////////////////////////////////////////
// new allocation
////////////////////////////////////////////////////////////////////////////////////////

/*
    it('creates New Allocation', () => {

      cy.on('uncaught:exception', (err, runnable) => {
        expect(err.message).to.include('convertible string')
        console.log('uncaught')
        return false
      })

///*
      cy.contains('span', 'Allocations', { timeout: 150000 }).wait(1000).click()
      .get('iframe').iframe().wait(1000).find('div').each((el) => {

        if (/ContextMenu__BaseButton/.test(el[0].className)) {
          //console.log('--', el[0].className)
          el[0].click()
        }
      }
      ).wait(1000)
      .get('iframe').iframe().contains('span', 'New Allocation', { timeout: 150000 }).wait(1000).click()
      .get('iframe').iframe().find('textarea[name="allocationDescription"]').type(ALLOC1)
      .get('iframe').iframe().find('input[name="amount"]').type('13')
      .get('iframe').iframe().wait(1000).find('div').each((el) => {

        if (/DropDown__DropDownActiveItem/.test(el[0].className)) {
          //console.log('--', el[0].className)
          el[0].click()
        }
      }
      ).wait(1000)
      .get('iframe').iframe().contains('div','autark').click().wait(1000)
      .get('iframe').iframe().find('input[placeholder="Enter an address option"]').type(KEY1)
      .get('iframe').iframe().contains('button','+ Add option').click().wait(1000)
      .get('iframe').iframe().find('input[placeholder="Enter an address option"]').type(KEY2)
      .get('iframe').iframe().contains('button','Submit Allocation').click().wait(1000)

      cy.contains('button','Create transaction').click()
      cy.contains('button','Close').click().wait(3000)
    })
  })
//*/
////////////////////////////////////////////////////////////////////////////////////////
// vote for allocation
////////////////////////////////////////////////////////////////////////////////////////

/*
  context('Dot Voting', () => {
    it('votes for Allocation', () => {

      cy.contains('span', 'Dot Voting', { timeout: 150000 }).wait(1000).click()
      cy.get('iframe').iframe().contains('p', ALLOC1).click()
      .get('iframe').iframe().wait(1000).find('div').each((el) => {
        if (/Slider__Area/.test(el[0].className)) {
          console.log('++', el[0].className, el)
          cy.wrap(el[0]).trigger('mousedown', { which: 1, x: 60, y: 5})
        }
      })
      .get('iframe').iframe().contains('button','Submit Vote').click().wait(1000)

      cy.contains('button','Create transaction').click()
      cy.contains('button','Close').click().wait(3000)
    })
  })
//*/
////////////////////////////////////////////////////////////////////////////////////////
// vote for allocation
////////////////////////////////////////////////////////////////////////////////////////
/*

      .get('iframe').iframe().contains('p', ALLOC1).click()
      .get('iframe').iframe().wait(1000).find('div').each((el) => {
        if (/VoteStatus__StatusLabel/.test(el[0].className)) {
          console.log('++ found sidepanel', el[0])
          cy.wrap(el[0]).within(($el) => {

            cy.find('span').each((el) => {
              if (/VoteStatus__StatusLabel/.test(el[0].className)) {
                console.log('+!!!+', el[0])
              }
            })
            
          })
        }
      })
/*
      .get('iframe').iframe().find('input').each((el) => {
        if (/TextInput/.test(el[0].className)) {
          console.log('--', el[0].className)
          el[0].click()
        }
      })
      
    })
  })
})
    */

