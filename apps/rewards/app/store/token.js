import {
  getTokenName,
  getTokenStartBlock,
  getTokenSymbol,
  getTransferable,
  isTokenVerified,
  tokenDataFallback,
} from '../utils/token-utils'
import { addressesEqual } from '../utils/web3-utils'
import tokenSymbolAbi from '../../../shared/json-abis/token-symbol.json'
import tokenNameAbi from '../../../shared/json-abis/token-name.json'
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
const tokensTransferable = new Map() // External contract -> symbol
const tokenStartBlock = new Map() // External contract -> creationBlock (uint)

const ETH_CONTRACT = Symbol('ETH_CONTRACT')

export async function initializeTokens(state, settings){
  // Set up ETH placeholders
  tokenContracts.set(settings.ethToken.address, ETH_CONTRACT)
  tokenDecimals.set(ETH_CONTRACT, '18')
  tokenName.set(ETH_CONTRACT, 'Ether')
  tokenSymbols.set(ETH_CONTRACT, 'ETH')
  tokensTransferable.set(ETH_CONTRACT, true)
  tokenStartBlock.set(ETH_CONTRACT, null)

  const withEthBalance = await loadEthBalance(state, settings)
  return { ...withEthBalance, amountTokens: [] }
}

export async function vaultLoadBalance(state, { returnValues }, settings) {
  const { token } = returnValues
  const { balances, refTokens } = await updateBalancesAndRefTokens(
    state,
    token || settings.ethToken.address,
    settings
  )
  return {
    ...state,
    balances,
    refTokens,
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function loadEthBalance(state, settings) {
  const { balances } = await updateBalancesAndRefTokens(state, settings.ethToken.address, settings)
  return {
    ...state,
    balances,
  }
}

export async function updateBalancesAndRefTokens({ balances = [], refTokens = [] }, tokenAddress, settings) {
  const tokenContract = tokenContracts.has(tokenAddress)
    ? tokenContracts.get(tokenAddress)
    : app.external(tokenAddress, tokenAbi)
  tokenContracts.set(tokenAddress, tokenContract)
  const balancesIndex = balances.findIndex(({ address }) =>
    addressesEqual(address, tokenAddress)
  )
  if (balancesIndex === -1) {
    const newBalance = await newBalanceEntry(tokenContract, tokenAddress, settings)
    let newRefTokens = Array.from(refTokens)
    if (newBalance.startBlock !== null) {
      const refIndex = refTokens.findIndex(({ address }) =>
        addressesEqual(address, tokenAddress)
      )

      if (refIndex === -1) {
        const { name, symbol, address, startBlock, decimals } = newBalance
        newRefTokens = newRefTokens.concat({ name, symbol, address, startBlock, decimals })
      }
    }
    const newBalances = balances.concat(newBalance)
    return { balances: newBalances, refTokens: newRefTokens }
  } else {
    const newBalances = Array.from(balances)
    newBalances[balancesIndex] = {
      ...balances[balancesIndex],
      amount: await loadTokenBalance(tokenAddress, settings),
    }

    return { balances: newBalances, refTokens }
  }
}

async function newBalanceEntry(tokenContract, tokenAddress, settings) {
  const [ balance, decimals, name, symbol, startBlock, transfersEnabled ] = await Promise.all([
    loadTokenBalance(tokenAddress, settings),
    loadTokenDecimals(tokenContract, tokenAddress, settings),
    loadTokenName(tokenContract, tokenAddress, settings),
    loadTokenSymbol(tokenContract, tokenAddress, settings),
    loadTokenStartBlock(tokenContract, tokenAddress, settings),
    loadTransferable(tokenContract, tokenAddress, settings),
  ])

  return {
    decimals,
    name,
    symbol,
    address: tokenAddress,
    amount: balance,
    startBlock,
    transfersEnabled,
    verified:
      isTokenVerified(tokenAddress, settings.network.type) ||
      addressesEqual(tokenAddress, settings.ethToken.address),
  }
}

function loadTokenBalance(tokenAddress, { vault }) {
  return vault.contract.balance(tokenAddress).toPromise()
}

function loadTokenDecimals(tokenContract, tokenAddress, { network }) {
  return new Promise(resolve => {
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
  return new Promise(resolve => {
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
  return new Promise(resolve => {
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

function loadTransferable(tokenContract, tokenAddress, { network }) {
  return new Promise(resolve => {
    if (tokensTransferable.has(tokenContract)) {
      resolve(tokensTransferable.get(tokenContract))
    } else {
      const fallback =
        tokenDataFallback(tokenAddress, 'transfersEnabled', network.type) || ''
      const tokenTransferable = getTransferable(app, tokenAddress)
      resolve(tokenTransferable || fallback)
    }
  })
}

function loadTokenStartBlock(tokenContract, tokenAddress) {
  return new Promise(resolve => {
    if (tokenStartBlock.has(tokenContract)) {
      resolve(tokenStartBlock.get(tokenContract))
    } else {
      const tokenStartBlock = getTokenStartBlock(app, tokenAddress)
      resolve(tokenStartBlock)
    }
  })
}
