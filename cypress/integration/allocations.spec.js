import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

const KEY1 = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
const KEY2 = '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb'
const ACC1 = 'Account 1'
const ALLOC1 = 'Allocation 3'

const provider1 = new PrivateKeyProvider(
  "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
  "http://localhost:8545"
);

const provider2 = new PrivateKeyProvider(
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
      const provider = new PrivateKeyProvider(
        "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
        "http://localhost:8545"
      );
      win.web3 = new Web3(provider);
    });
    cy.visit('http://localhost:3000/#/0x5b6a3301a67A4bfda9D3a528CaD34cac6e7F8070')
  })

////////////////////////////////////////////////////////////////////////////////////////
// new account
////////////////////////////////////////////////////////////////////////////////////////

///*
  context('Allocations', () => {
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
//*/

////////////////////////////////////////////////////////////////////////////////////////
// new allocation
////////////////////////////////////////////////////////////////////////////////////////


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
//*/
////////////////////////////////////////////////////////////////////////////////////////
// vote for allocation
////////////////////////////////////////////////////////////////////////////////////////

})
///*
  })
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
      
      */
    })
  })
})

