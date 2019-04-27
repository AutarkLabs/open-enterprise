import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

const KEY1 = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
const KEY2 = '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb'
const ACC1 = 'Account 1'
const ALLOC1 = 'Allocation 3'


context('Aragon', () => {
  before(() => {
    cy.on("window:before:load", (win) => {
      const provider = new PrivateKeyProvider(
        "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
        "http://localhost:8545"
      );
      win.web3 = new Web3(provider);
    });
    cy.visit('http://localhost:3000/#/0x5b6a3301a67A4bfda9D3a528CaD34cac6e7F8070')
  })
////////////////////////////////////////////////////////////////////////////////////////
// Allocations
////////////////////////////////////////////////////////////////////////////////////////
    context('Dot Voting', () => {
        it('votes for Allocation', () => {

        cy.contains('span', 'Dot Voting', { timeout: 150000 }).wait(1000).click()
        cy.get('iframe').iframe().wait(10000).contains('p', ALLOC1).click()
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
})
