/// <reference types="Cypress" />
import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

context('Address Book', () => {
  before(() => {
    cy.on('window:before:load', win => {
      const provider = new PrivateKeyProvider(
        'A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563',
        'http://localhost:8545'
      )
      win.web3 = new Web3(provider)
    })
    // fresh dev dao address
    cy.visit('http://localhost:3000/#/dev-dao-0')
    cy.contains('button','Address Book',{ timeout: 150000 }).wait(1000).click()
  })
  it('creates Address Entry', () =>{
      
    cy.getWithinIframe('button:contains("New entity")').trigger('click')
    .getWithinIframe('input[name="name"]').type('Hello World', { force: true })
    .getWithinIframe('input[name="address"]').type('0xb4124ceb3451635dacedd11767f004d8a28c6ee7', { force: true })
    .getWithinIframe('button:contains("Submit entity")').click()

    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click()
    // a basic validations that the entry exists in the table
    //cy.getWithinIframe('div.TableView___StyledTd-aczwu3-3:contains("Hello World")')
  })
  it('removes Address Entry', () => {
    // click the button that opens the context menu
    cy.getWithinIframe('button.fcvbGI').trigger('click')
    .getWithinIframe('Button:contains("Remove")').trigger('click').wait(1000)

    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
  })
})
