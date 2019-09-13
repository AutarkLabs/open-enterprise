// import { vaultLoadBalance } from './token'
import { updateAccounts } from './account'
// import { addressesEqual } from '../utils/web3-utils'

const eventHandler = async eventData => {
  const {
    state,
    event: { address, event, returnValues },
    settings,
  } = eventData

  // const { vault } = settings
  // const { accounts, payouts } = state

  // let nextAccounts, nextBoth
  // let nextState = { ...state }
  // if (addressesEqual(eventAddress, vault.address)) {
  // Vault event
  // nextState = await vaultLoadBalance(nextState, event, settings)
  // } else {
  // console.log('Event received', eventName)

  // Allocations event
  switch (event) {
  // case 'FundAccount':
  //   nextAccounts = await onFundedAccount(accounts, returnValues)
  //   nextState.accounts = nextAccounts
  //   break
  case 'NewAccount':
    return {
      ...state,
      accounts: await updateAccounts(state.accounts, returnValues.accountId),
    }
    // nextState.accounts = nextAccounts
    // break
    // case 'PayoutExecuted':
    //   nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)
    //   nextState.accounts = nextBoth.accounts
    //   nextState.payouts = nextBoth.payouts
    //   break
    // case 'SetDistribution':
    //   nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)
    //   nextState.accounts = nextBoth.accounts
    //   nextState.payouts = nextBoth.payouts
    //   break
  default:
    return state
  }
}

export default eventHandler
