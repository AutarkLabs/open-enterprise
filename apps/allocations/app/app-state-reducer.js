import { BigNumber } from 'bignumber.js'
import { ETHER_TOKEN_FAKE_ADDRESS } from '../../../shared/lib/token-utils'
import { addressesEqual } from '../../../shared/lib/web3-utils'

// Use this function to sort by ETH and then token symbol
const compareBalancesByEthAndSymbol = (tokenA, tokenB) => {
  if (tokenA.address === ETHER_TOKEN_FAKE_ADDRESS) {
    return -1
  }
  if (tokenB.address === ETHER_TOKEN_FAKE_ADDRESS) {
    return 1
  }
  return tokenA.symbol.localeCompare(tokenB.symbol)
}

const getTokenFromAddress = (tokenAddress, tokenList) => {
  if (!tokenList || !tokenList.length) return null
  return tokenList.find(token => addressesEqual(token.address, tokenAddress))
}

function appStateReducer(state) {
  const { accounts: budgets, balances, allocations, period } = state || {}
  const { endDate } = period || {}
  const currentDate = new Date()
  // TODO: convert balances to an object to decrease computational complexity on token lookups in script.js
  const balancesBn = balances
    ? balances
      .map(balance => ({
        ...balance,
        amount: new BigNumber(balance.amount),
        decimals: new BigNumber(balance.decimals),

        // Note that numbers in `numData` are not safe for accurate
        // computations (but are useful for making divisions easier).
        numData: {
          amount: parseInt(balance.amount, 10),
          decimals: parseInt(balance.decimals, 10),
        },
      }))
      .sort(compareBalancesByEthAndSymbol)
    : []

  const budgetsBn = budgets
    ? budgets
      // prevent any budgets missing token data from getting passed to the frontend
      .filter(budget => getTokenFromAddress(budget.token, balances))
      .map(budget => ({
        ...budget,
        active: budget.hasBudget && Number(budget.amount) > 0,
        // get some extra info about the token
        token: getTokenFromAddress(budget.token, balances),
        // if current period end date is less than now, current period is over
        // but not updated on chain. so we reset the remaining budget
        remaining: endDate < currentDate ? budget.amount : budget.remaining,
      // amount: new BigNumber(budget.amount),
      // numData: {
      //   amount: parseInt(budget.amount, 10),
      // },
      }))
    : []

  const allocationsBn = allocations
    ? allocations
      // prevent any allocation details missing token data from getting passed to the frontend
      .filter(allocation => getTokenFromAddress(allocation.token, balances))
      .map(allocation => ({
        ...allocation,
        // get some extra info about the token
        tokenDecimal: getTokenFromAddress(allocation.token, balances).decimals
      }))
    : []

  const newState = {
    ...state,

    tokens: balancesBn.map(
      ({ address, name, symbol, amount, decimals, verified }) => ({
        address,
        amount,
        decimals,
        name,
        symbol,
        verified,
      })
    ),

    // tokens: balancesBn.map(
    // ({ address, name, symbol, numData: { amount, decimals }, verified }) => ({
    // address,
    // amount,
    // decimals,
    // name,
    // symbol,
    // verified,
    // })
    // ),

    // Filter out empty balances
    // balances: balancesBn.filter(balance => !balance.amount.isZero()),
    balances: balancesBn.filter(balance => balance.amount !== 0),

    budgets: budgetsBn,
    allocations: allocationsBn,
  }
  return newState
}

export default appStateReducer
