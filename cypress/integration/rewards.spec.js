import Web3 from "web3"
import PrivateKeyProvider from "truffle-privatekey-provider"

const root = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
const finance = '0x1902a0410efe699487dd85f12321ad672be4ada2'
// TODO move the github token variable to an environment file or config


context('Rewards', () => {
  before(() => {
    cy.on("window:before:load", (win) => {
      const provider = new PrivateKeyProvider(
        "A8A54B2D8197BC0B19BB8A084031BE71835580A01E70A45A13BABD16C9BC1563",
        "http://localhost:8545"
      );
      win.web3 = new Web3(provider);
    });
    cy.on("window:load", async (win) => {
      if (win.web3) {
        console.log(win.web3)
        await win.web3.eth.sendTransaction({ 
          from: root,  
          to: finance, // needs to be updated when aragonCLI or aragen are updated
          value: 2e18, 
          gas: 350000 
        })

        let tokenAddress = "0xf2804D07A941F77F34EEEb252D172E4268d0e9D4"
        // Use BN
        let decimals = win.web3.utils.toBN(18)
        let amount = win.web3.utils.toBN(1)
        // TODO move these ABIs to the fixtures folder
        let minFinanceABI = [{
          "constant": false,
          "inputs": [
            {
              "name": "_token",
              "type": "address"
            },
            {
              "name": "_amount",
              "type": "uint256"
            },
            {
              "name": "_reference",
              "type": "string"
            }
          ],
          "name": "deposit",
          "outputs": [],
          "payable": true,
          "stateMutability": "payable",
          "type": "function"
        }]
        let minTokenABI = [
          // approve
          {
            "constant": false,
            "inputs": [
                {
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
          },
          // transfer
          {
            "constant": false,
            "inputs": [
              {
                "name": "_to",
                "type": "address"
              },
              {
                "name": "_value",
                "type": "uint256"
              }
            ],
            "name": "transfer",
            "outputs": [
              {
                "name": "",
                "type": "bool"
              }
            ],
            "type": "function"
          }
        ];
        // Get ERC20 Token contract instance
        let tokenContract = new win.web3.eth.Contract(minTokenABI, tokenAddress)
        // calculate ERC20 token amount
        let value = amount.mul(win.web3.utils.toBN(10).pow(decimals))
        // call approve function
        await tokenContract.methods.approve(finance, value.toString())
        .send( {from: root}, (error, txHash) => {
          // it returns tx hash because sending tx
          console.log('tokens approved: ',txHash)
        })

        // Get Finance Contract instance
        let financeContract = new win.web3.eth.Contract(minFinanceABI, finance)
        await financeContract.methods.deposit(tokenAddress, value.toString(), 'E2E test deposit')
        .send( {from: root, gas: 700000}, (error, txHash) => {
          // it returns tx hash because sending tx
          console.log('tokens transferred: ',txHash)
        })
      }
    })
    // plug in fresh dev dao address here
    cy.visit('http://localhost:3000/#/dev-dao-0')
    cy.contains('button','Rewards',{ timeout: 150000 }).click()
  })

  it('creates a one-time dividend', () => {
    const now = new Date()
    const next = new Date()
    const dayOfMonth = now.getDate()
    next.setDate(dayOfMonth+1)

    // block until state is completely synced
    cy.getWithinIframe('div[class^=EmptyStateCard]:contains("No rewards here!")').wait(15000)
    cy.getWithinIframe('button:contains("New reward")').trigger('click')
    cy.getWithinIframe('textarea[name="description"]').type('for all AUTD hodlers', { force: true })
    cy.getWithinIframe('button[name="referenceAsset"]').click()
    cy.getWithinIframe('button:contains("AUTD")').last().click()
    cy.getWithinIframe('button[name="rewardType"]').click()
    cy.getWithinIframe('button:contains("One-time Dividend")').last().click()
    cy.getWithinIframe('input[name="amount"]').then(([ input ]) => input.setAttribute('type', 'text')).type(1.25, {force: true})
    /* interacting with the DatePicker - not needed here
    cy.getWithinIframe('input[class^="DateInput"]').then(element => console.log('element: ', element)).click()
    cy.getWithinIframe('button[class^="DatePicker__ArrowButton"]').last().click() //advance next month
    cy.getWithinIframe(`li[class^="DatePicker__DayView"]:contains(${next.getDate()})`).first().click() // select the next calculated day
    */
    cy.getWithinIframe('button:contains("Continue")').click().wait(1000)
    cy.getWithinIframe('button:contains("Submit")').click()

    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click()
  })

  it('can claim a reward', () => {
    cy.exec('npm run mine 8000', { timeout: 200000 }).then(res => console.info(res.stderr, '\n',res.stdout))
    cy.getWithinIframe('span:contains("My Rewards")', {timeout: 600000}).click()
    // open up the context menu in the My Rewards table
    cy.getWithinIframe('td[class^="TableView"]:contains("Ready to claim")', {timeout: 600000})
    cy.wait(5000).getWithinIframe('button.fcvbGI').last().trigger('click')
    cy.getWithinIframe('button:contains("Claim")').click()

    cy.contains('button','Create transaction').click()
    cy.contains('button','Close').click().wait(1000)
  })
})
