import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

// enter a valid github token here
const githubToken = 'fabba23e6a0ee305000820c8c0e0b2bad78aa802'

const root = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
const finance = '0x1902a0410efe699487dd85f12321ad672be4ada2'

context('Projects', () => {
  let unfetch
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
          value: 1.25e17, 
          gas: 350000 
        })
      }
    })
    // fresh dev dao address
    cy.visit('http://localhost:3000/#/dev-dao-0')
    cy.contains('button','Projects',{ timeout: 150000 }).click().wait(10000)
    cy.getWithinIframe('button:contains("Sign In")').click()
    // intercept login popup and inject our own github token
    cy.get('iframe').iframeLoaded().then(win => {
      // save the real fetch method
      unfetch = win.fetch
      //implement our spoof method which will return a valid token
      win.fetch = async () => ({json: async () => ({"token": githubToken})})
      // interceipt the popup and trigger the popup handler by posting this message to the iframe
      win.postMessage({ from: 'popup', name: 'code', value: '1234' },'*')
    })
    // reimplement the correct fetch method so graphQL will work for us
    .iframeElementLoaded('button:contains("New project")').then(win =>  win.fetch = unfetch)
  })

  it('adds a new project', () => {
    //cy.wait(10000)
    cy.getWithinIframe('button:contains("New project")').first().click()
    // select this project (so meta)
    cy.getWithinIframe('div[class*=RadioListItem]:contains("autest-e2e/testProject")').first().click()
    cy.getWithinIframe('button:contains("Submit")').click()
    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
    cy.getWithinIframe('span[class^=Tab]:contains("Issues")').click().wait(5000)
  })

  it('funds an issue', () => {
    //cy.wait(10000)
    //cy.getWithinIframe('span.iwJMtI:contains("Overview")').click()
    // click the issues tab at the top of the page
    //cy.getWithinIframe('span[class^=Tab]:contains("Issues")').click().wait(5000)
    // check the checkbox on the first issue
    cy.getWithinIframe('div[class^=Issue___StyledDiv]').find('button[class^=Checkbox]').first().click()
    cy.getWithinIframe('button[title="Actions Menu"]').click()
    cy.getWithinIframe('button:contains("Fund issues")').click()
    cy.getWithinIframe('textarea[name="description"]').type('plz fix', { force: true })
    cy.getWithinIframe('input[name="amount"]').then(([ input ]) => input.setAttribute('type', 'text')).type('0.125', {force: true})
    cy.getWithinIframe('button:contains("Fund Issue")').click()
    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
  })
    xit('submits application', () => {
      cy.wait(10000)
      //cy.getWithinIframe('span.iwJMtI:contains("Overview")').click()
      // click the issues tab at the top of the page
      //cy.getWithinIframe('span.iwJMtI:contains("Issues")').click()
      // click the context menu button in the first issue
      cy.getWithinIframe('div.cyKgLq').first().find('button').click()
      cy.getWithinIframe('button:contains("Submit Application")').click()
      cy.getWithinIframe('textarea[name="workplan"]').type('will fix', { force: true })
      cy.getWithinIframe('input[name="hours"]').then(([ input ]) => input.setAttribute('type', 'text')).type(5, {force: true})
      // the the first agreement checkbox
      cy.getWithinIframe('div.dqKzoJ').first().find('button').click()
      // the the first agreement checkbox
      cy.getWithinIframe('div.krBDmE').first().find('button').click()
      cy.getWithinIframe('button:contains("Submit application")').click()

      cy.contains('button','Create transaction').click()
      cy.contains('button','Close').click().wait(1000)
    })

    xit('accepts application', () => {
      cy.wait(5000)
      //cy.getWithinIframe('span.iwJMtI:contains("Overview")').click()
      // click the issues tab at the top of the page
      //cy.getWithinIframe('span.iwJMtI:contains("Issues")').click()
      // click the context menu button in the first issue
      cy.getWithinIframe('div.cyKgLq').first().find('button').click()
      cy.getWithinIframe('button:contains("Review Application")').click()
      cy.getWithinIframe('button:contains("Accept")').click()

      cy.contains('button','Create transaction').click()
      cy.contains('button','Close').click().wait(1000)
    })

  it('submits work', () => {
    cy.wait(10000)
    //cy.getWithinIframe('span.iwJMtI:contains("Overview")').click()
    // click the issues tab at the top of the page
    //cy.getWithinIframe('span.iwJMtI:contains("Issues")').click()
    // click the context menu button in the first issue
    cy.getWithinIframe('button[class^="ContextMenu"]').first().click()
    cy.getWithinIframe('button:contains("Submit work")').click()
    cy.getWithinIframe('textarea[name="proof"]').type('fixed here: https://checkout.me', { force: true })
    cy.getWithinIframe('input[name="hours"]').then(([ input ]) => input.setAttribute('type', 'text')).type(1, {force: true})
    // the the first agreement checkbox
    cy.getWithinIframe('div.fdoNZb').first().find('button').click()
    // check the second agreement checkbox
    cy.getWithinIframe('div.isYXnM').first().find('button').click()
    cy.getWithinIframe('button:contains("Submit Work")').click()
    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
  })

  it('accepts work', () => {
    cy.wait(5000)
    //cy.getWithinIframe('span.iwJMtI:contains("Overview")').click()
    // Click the Issues Tab at the top of the page
    //cy.getWithinIframe('span.iwJMtI:contains("Issues")').click()
    // click context menu within  the div of the first issue
    cy.getWithinIframe('button[class^="ContextMenu"]').first().click()
    cy.getWithinIframe('button:contains("View work submission")').click()
    cy.getWithinIframe('button:contains("Select rating")').click()
    cy.getWithinIframe('button:contains("5 - Excellent")').last().click()
    // Click the accept button, not the "acceptable" review button in the dropdown
    cy.getWithinIframe('button[class^="PanelComponents"]:contains("Accept")').last().click()
    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
  })
})
