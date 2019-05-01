import Web3 from '@aragon/wrapper/node_modules/web3'
import { addDays } from 'date-fns'

const PrivateKeyProvider = require('truffle-privatekey-provider')
const ProviderEngine = require('truffle-privatekey-provider/node_modules/web3-provider-engine')
const CacheSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/filters.js')
const VmSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/vm.js')
const NonceSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/nonce-tracker.js')
const RpcSubprovider = require('truffle-privatekey-provider/node_modules/web3-provider-engine/subproviders/rpc.js')

var engine = new ProviderEngine()

var web3A = new Web3(engine)
var web3B = new Web3(engine)

engine.addProvider(
  new FixtureSubprovider({
    web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x00',
    eth_mining: false,
    eth_syncing: true,
  })
)

engine.addProvider(new CacheSubprovider())
engine.addProvider(new FilterSubprovider())
engine.addProvider(new NonceSubprovider())
engine.addProvider(new VmSubprovider())

// data source
engine.addProvider(
  new RpcSubprovider({
    rpcUrl: 'http://localhost:8545',
  })
)
/*
engine.on('block', function(block) {
  console.log('================================')
  console.log(
    'BLOCK CHANGED:',
    '#' + block.number.toString('hex'),
    '0x' + block.hash.toString('hex')
  )
  console.log('================================')
})
*/
engine.on('error', function(err) {
  console.error(err.stack)
})

engine.start()

const user1 = new PrivateKeyProvider(
  'A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563',
  'http://localhost:8545'
)

const user2 = new PrivateKeyProvider(
  'ce8e3bda3b44269c147747a373646393b1504bfcbb73fc9564f5d753d8116608',
  'http://localhost:8545'
)

web3A.setProvider(user1)
web3B.setProvider(user2)


context('Aragon', () => {
  context('Rewards', () => {

  before(() => {
    cy.on('window:before:load', win => {
      win.web3 = web3A
      console.log('A', web3A.eth.accounts)
      console.log('B', web3B.eth.accounts)
          })
    cy.visit(
      'http://localhost:3000/#/0x5b6a3301a67A4bfda9D3a528CaD34cac6e7F8070'
    )
  })

/////////////////////////////////////////////////////////////////////////////
// create new merit reward
/////////////////////////////////////////////////////////////////////////////

    it('creates New Reward (Merit)', () => {
      const tomorrow = addDays(new Date(), 3) + ''

      cy.contains('span', 'Rewards', { timeout: 150000 })
        .click()
        .wait(4000)

      cy.getButton('New Reward')
        .click()
        .wait(1000)
        .appFind('input[name="description"]')
        .type('Merit Reward')
        .appFind('input[name="amount"]')
        .type(3)
        .appFind('div[data-e2e="reward-amount-currency"]')
        .click('right')
        .within($el => {
          cy.contains('div', 'autark')
            .click()
        })

      cy.appContains('aside', 'New Reward')
        .appContains('div', 'Select a token')
        .click()
        .appFind('span[data-e2e-token="autark"]')
        .click({ force: true })
        .appFind('input[name="periodEnd"]')
        .type(tomorrow)
        .appFind('input[name="periodEnd"]')
        .trigger('keydown', {
          keyCode: 13,
          which: 13,
        })

      cy.getButton('Submit Reward')
        .click()
        .wait(1000)

      cy.contains('button', 'Create transaction').click()
      cy.contains('button', 'Close')
        .click()
        .wait(3000)
    })

/////////////////////////////////////////////////////////////////////////////
// create new dividend reward
/////////////////////////////////////////////////////////////////////////////

    it('creates New Reward (Dividend)', () => {
      const tomorrow = addDays(new Date(), 98) + ''

      cy.contains('span', 'Rewards', { timeout: 150000 })
        .click()
        .wait(4000)

      cy.getButton('New Reward')
        .click()
        .wait(500)

      cy.appContains('aside', 'New Reward')
        .contains('div', 'Merit Reward')
        .click()
        .siblings('[role="listbox"]')
        .children()
        .contains('div', 'Dividend')
        .click()
        .appFind('input[name="description"]')
        .type('Dividend Reward')
        .appFind('input[name="amount"]')
        .type(4)
        .appFind('div[data-e2e="reward-amount-currency"]')
        .click('right')
        .within($el => {
          cy.contains('div', 'autark')
            .click()
        })

      cy.appContains('aside', 'New Reward')
        .appContains('div', 'Select a token')
        .click()
        .appFind('span[data-e2e-token="autark"]')
        .click({ force: true })
        .appFind('input[name="dateEnd"]')
        .type(tomorrow)
        .appFind('input[name="dateEnd"]')
        .trigger('keydown', {
          keyCode: 13,
          which: 13,
        })
      
      cy.getButton('Submit Reward')
        .click()
        .wait(1000)

      cy.contains('button', 'Create transaction').click()
      cy.contains('button', 'Close')
        .click()
        .wait(3000)
    })

/////////////////////////////////////////////////////////////////////////////
// show both rewards no page and in panels
/////////////////////////////////////////////////////////////////////////////

    it('shows New Reward (Merit)', () => {
      cy.contains('span', 'Rewards', { timeout: 150000 })
        .click()
        .wait(4000)
      cy.appContains('span[data-e2e-reward-description="0"]', 'Merit Reward')
      cy.appContains('span[data-e2e-reward-badge-amount="0"]', 3)
      cy.appContains('span[data-e2e-reward-badge-symbol="0"]', 'autark')
      cy.appContains('span[data-e2e-reward-type="0"]', 'Merit Reward')
    })

    it('shows New Reward (Dividend)', () => {
      cy.contains('span', 'Rewards', { timeout: 150000 })
        .click()
        .wait(4000)
      cy.appContains('span[data-e2e-reward-description="1"]', 'Dividend Reward')
      cy.appContains('span[data-e2e-reward-badge-amount="1"]', 4)
      cy.appContains('span[data-e2e-reward-badge-symbol="1"]', 'autark')
      cy.appContains('span[data-e2e-reward-type="1"]', 'Dividend')
    })

    it('shows New Reward (Merit) in Panel', () => {
      cy.contains('span', 'Rewards', { timeout: 150000 })
        .click()
        .wait(4000)
      cy.appFind('span[data-e2e-reward-description="0"]', 'Merit Reward')
        .click()
        .wait(500)
      cy.appContains('span[data-e2e-reward-badge-amount="0"]', 3)
      cy.appContains('span[data-e2e-reward-panel-symbol="0"]', 'autark')
      cy.getButton('Close').click()
    })

    it('shows New Reward (Dividend) in Panel', () => {
      cy.contains('span', 'Rewards', { timeout: 150000 })
        .click()
        .wait(4000)
      cy.appFind('span[data-e2e-reward-description="0"]', 'Dividend Reward')
        .click()
        .wait(500)
      cy.appContains('span[data-e2e-reward-badge-amount="0"]', 3)
      cy.appContains('span[data-e2e-reward-panel-symbol="0"]', 'autark')
      cy.getButton('Close').click()
    })

/////////////////////////////////////////////////////////////////////////////
// switch accounts - first should have no rewards
/////////////////////////////////////////////////////////////////////////////

    it('My Rewards is empty for the second account', () => {
      cy.window()
      .then((win) => {
        console.log('---+$ web3', win.web3.eth.accounts._provider.address)
      })

      cy.on('window:before:load', win => {
        win.web3 = web3B
      })
      cy.visit(
        'http://localhost:3000/#/0x5b6a3301a67A4bfda9D3a528CaD34cac6e7F8070'
      )
      cy.reload()


      cy.window()
      .then((win) => {
        console.log('---+^ web3', win.web3.eth.accounts._provider.address)
      })

      cy.contains('span', 'Rewards', { timeout: 150000 })
        .click()
        .wait(4000)
      cy.appContains('span', 'My Rewards')
        .click()
        .wait(10000)
      cy.appContains('span', 'You have not been awarded any rewards')
    })

    it('My Rewards is not empty for the first account', () => {

      cy.window()
      .then((win) => {
        console.log('---+& web3', win.web3.eth.accounts._provider.address)
      })

      cy.on('window:before:load', win => {
        win.web3 = web3A
      })
      cy.visit(
        'http://localhost:3000/#/0x5b6a3301a67A4bfda9D3a528CaD34cac6e7F8070'
      )
      cy.reload()

      cy.window()
      .then((win) => {
        console.log('---+* web3', win.web3.eth.accounts._provider.address)
      })

      cy.contains('span', 'Rewards', { timeout: 150000 })
      .click()
      .wait(4000)
      cy.appContains('span', 'My Rewards')
      .click()
      .wait(10000)
      .appContains('span[data-e2e-reward-status="pending"]', 'Pending...')
      .appContains('span[data-e2e-reward-badge-amount="0"]', '2.667')
    })

  })
})
