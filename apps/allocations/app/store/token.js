import {
  ETHER_TOKEN_FAKE_ADDRESS,
  isTokenVerified,
  tokenDataFallback,
  getTokenSymbol,
  getTokenName,
} from '../utils/token-utils'
import { addressesEqual } from '../utils/web3-utils'
import tokenSymbolAbi from '../../../shared/json-abis/token-symbol.json'
import tokenSymbolBytesAbi from '../../../shared/json-abis/token-symbol-bytes.json'
import tokenNameAbi from '../../../shared/json-abis/token-name.json'
import tokenNameBytesAbi from '../../../shared/json-abis/token-name-bytes.json'
import tokenBalanceAbi from '../../../shared/json-abis/token-balanceof.json'
import tokenDecimalsAbi from '../../../shared/json-abis/token-decimals.json'
import { app } from './'

const tokenAbi = [].concat(
  tokenSymbolAbi,
  tokenNameAbi,
  tokenBalanceAbi,
  tokenDecimalsAbi
)

const tokenContracts = new Map() // Addr -> External contract
const tokenDecimals = new Map() // External contract -> decimals
const tokenName = new Map() // External contract -> name
const tokenSymbols = new Map() // External contract -> symbol

const ETH_CONTRACT = Symbol('ETH_CONTRACT')

export async function initializeTokens(state, settings) {
  // Set up ETH placeholders
  tokenContracts.set(settings.ethToken.address, ETH_CONTRACT)
  tokenDecimals.set(ETH_CONTRACT, '18')
  tokenName.set(ETH_CONTRACT, 'Ether')
  tokenSymbols.set(ETH_CONTRACT, 'ETH')

  const nextState = {
    ...state,
    addressBookAddress: settings.addressBook.address,
    vaultAddress: settings.vault.address,
  }
  const withEthBalance = await loadEthBalance(nextState, settings)
  return withEthBalance
}

export async function vaultLoadBalance(state, { returnValues }, settings) {
  const { token } = returnValues
  const r = await updateBalances(
    state,
    token || settings.ethToken.address,
    settings
  )
  return {
    ...state,
    balances: r.newBalances,
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function loadEthBalance(state, settings) {
  return {
    ...state,
    balances: await updateBalances(state, settings.ethToken.address, settings),
  }
}

async function updateBalances({ balances = [] }, tokenAddress, settings) {
  const tokenContract = tokenContracts.has(tokenAddress)
    ? tokenContracts.get(tokenAddress)
    : app.external(tokenAddress, tokenAbi)
  tokenContracts.set(tokenAddress, tokenContract)

  const balancesIndex = balances.findIndex(({ address }) =>
    addressesEqual(address, tokenAddress)
  )
  if (balancesIndex === -1) {
    return balances.concat(
      await newBalanceEntry(tokenContract, tokenAddress, settings)
    )
  } else {
    const newBalances = Array.from(balances)
    newBalances[balancesIndex] = {
      ...balances[balancesIndex],
      amount: await loadTokenBalance(tokenAddress, settings),
    }
    return newBalances
  }
}

async function newBalanceEntry(tokenContract, tokenAddress, settings) {
  const [ balance, decimals, name, symbol ] = await Promise.all([
    loadTokenBalance(tokenAddress, settings),
    loadTokenDecimals(tokenContract, tokenAddress, settings),
    loadTokenName(tokenContract, tokenAddress, settings),
    loadTokenSymbol(tokenContract, tokenAddress, settings),
  ])
  console.log('we got network:', settings.network)

  return {
    decimals,
    name,
    symbol,
    address: tokenAddress,
    amount: balance,
    verified:
      isTokenVerified(tokenAddress, settings.network.type) ||
      addressesEqual(tokenAddress, settings.ethToken.address),
  }
}

function loadTokenBalance(tokenAddress, { vault }) {
  return vault.contract.balance(tokenAddress).toPromise()
}

function loadTokenDecimals(tokenContract, tokenAddress, { network }) {
  return new Promise((resolve, _reject) => {
    if (tokenDecimals.has(tokenContract)) {
      resolve(tokenDecimals.get(tokenContract))
    } else {
      const fallback =
        tokenDataFallback(tokenAddress, 'decimals', network.type) || '0'

      tokenContract.decimals().subscribe(
        (decimals = fallback) => {
          tokenDecimals.set(tokenContract, decimals)
          resolve(decimals)
        },
        () => {
          // Decimals is optional
          resolve(fallback)
        }
      )
    }
  })
}

function loadTokenName(tokenContract, tokenAddress, { network }) {
  return new Promise((resolve, reject) => {
    if (tokenName.has(tokenContract)) {
      resolve(tokenName.get(tokenContract))
    } else {
      const fallback =
        tokenDataFallback(tokenAddress, 'name', network.type) || ''
      const name = getTokenName(app, tokenAddress)
      resolve(name || fallback)
    }
  })
}

function loadTokenSymbol(tokenContract, tokenAddress, { network }) {
  return new Promise((resolve, reject) => {
    if (tokenSymbols.has(tokenContract)) {
      resolve(tokenSymbols.get(tokenContract))
    } else {
      const fallback =
        tokenDataFallback(tokenAddress, 'symbol', network.type) || ''
      const tokenSymbol = getTokenSymbol(app, tokenAddress)
      resolve(tokenSymbol || fallback)
    }
  })
}
