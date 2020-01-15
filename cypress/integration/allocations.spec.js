/// <reference types="Cypress" />
import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

const root = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
const finance = '0x1902a0410efe699487dd85f12321ad672be4ada2'
context('Allocations', () => {
  before(() => {
    cy.on('window:before:load', win => {
      const provider = new PrivateKeyProvider(
        'A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563',
        'http://localhost:8545'
      )
      win.web3 = new Web3(provider)
    })
    cy.on("window:load", async (win) => {
      if (win.web3) {
        console.log(win.web3)
        await win.web3.eth.sendTransaction({ 
          from: root,  
          to: finance, // needs to be updated when aragonCLI or aragen are updated
          value: 2.5e17, 
          gas: 350000 
        })
      }
    })
    // fresh dev dao address
    cy.visit('http://localhost:3000/#/dev-dao-0').wait(5000)
    cy.contains('button','Allocations',{ timeout: 150000 }).click()
  })
  it('creates a budget', () => {
    cy.getWithinIframe('button:contains("New budget")').trigger('click')
    .getWithinIframe('input[name="name"]').click().type('Hello World', { force: true }).wait(1000)
    // For some reason this element doesn't accept Cypress' keypressed numbers, so I had to update the attribute then
    // use 'type' to get the panel state to update
    // todo: update the setAttribute to type=='text' so it's typable (see Projects)
    .getWithinIframe('input[name="amount"]').then(([ input ]) => input.setAttribute('value', 1.25)).type(0, {force: true})
    .getWithinIframe('button:contains("Create budget")').click()

    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
  })
  it('creates an allocation', () => {
    // click on budget card context menu
    cy.wait(5000)//.getWithinIframe('button.fcvbGI').first().trigger('click')
    .getWithinIframe('Button:contains("New allocation")').trigger('click').wait(1000)
    .getWithinIframe('button[name="budget"]').click()
    .getWithinIframe('div:contains("Hello World")').last().click()
    .getWithinIframe('input[name="description"]').click().type('Try Hello World', { force: true }).wait(1000)
    .getWithinIframe('input[name="amount"]').then(([ input ]) => input.setAttribute('type', 'text')).type(0.25, {force: true})
    // click on the autocomplete address box and enter a full address
    .getWithinIframe('input.gKRZox').last().click().type('0xb4124ceb3451635dacedd11767f004d8a28c6ee7', { force: true }).wait(1000)
    .getWithinIframe('Button:contains("Submit")').trigger('click').wait(1000)

    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
  })
  context('Dot Voting', () => {
    before(() => {
      cy.contains('button','Dot Voting',{ timeout: 150000 }).click().wait(5000)
    })
    it('votes for allocation', () => {
      // click on the first vote card
      cy.wait(5000).getWithinIframe('div.XwjlG').first().click().wait(1500)
      .getWithinIframe('Button:contains("Vote")').click()
      // click on the slider at a point where a non-zero value will be set
      .getWithinIframe('div.jnspDJ').trigger('mousedown', { which: 1, x: 500, y: 5}).trigger('mouseup').wait(500)
      cy.getWithinIframe('button:contains("Submit vote")').click().wait(1000)

      cy.contains('button','Create transaction').click()
      cy.contains('button','Close').click().wait(5000)

      /* left as a potential reference for validation
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
      .get('iframe').iframe().find('input').each((el) => {
        if (/TextInput/.test(el[0].className)) {
          console.log('--', el[0].className)
          el[0].click()
        }
      })
      */
    })

    it('executes the vote', () => {
      // click on the most recent vote card
      //cy.getWithinIframe('button:contains("Back")').click()
      cy.getWithinIframe('div.XwjlG').first().click().wait(60000)
      cy.getWithinIframe('button:contains("Execute vote")').click()

      cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
    })
  })
})
