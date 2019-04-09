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

const tokenAbi = [].concat(tokenSymbolAbi, tokenNameAbi, tokenBalanceAbi, tokenDecimalsAbi)

const ETH_CONTRACT = Symbol('ETH_CONTRACT')

export async function initializeTokens(state, settings) {
  const nextState = {
    ...state,
    vaultAddress: settings.vault.address,
    tokenContracts: new Map(), // Addr -> External contract
    tokenDecimals: new Map(), // External contract -> decimals
    tokenNames: new Map(), // External contract -> name
    tokenSymbols: new Map(), // External contract -> symbol
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
  const {
    newBalances,
    tokenContracts,
    tokenDecimals,
    tokenNames,
    tokenSymbols
  } = await updateBalances(state, settings.ethToken.address, settings)
  const [ethBalance] = newBalances
  ethBalance.symbol = 'ETH'
  ethBalance.name = 'Ether'
  ethBalance.decimals = '18'
  return {
    ...state,
    balances: newBalances,
    tokenContracts: tokenContracts,
    tokenSymbols: tokenSymbols,
    tokenNames: tokenNames,
    tokenDecimals: tokenDecimals,
  }

}

async function updateBalances(
  { balances = [],  tokenContracts, tokenSymbols, tokenDecimals, tokenNames },
  tokenAddress,
  settings
) {
  const tokenContract = tokenContracts.has(tokenAddress)
    ? tokenContracts.get(tokenAddress)
    : app.external(tokenAddress, tokenAbi)
    //tokenContracts.set(tokenAddress, tokenContract)

  const balancesIndex = balances.findIndex(({ address }) =>
    addressesEqual(address, tokenAddress)
  )
  if (balancesIndex === -1) {
    const r = await newBalanceEntry(
      tokenContract,
      tokenAddress,
      settings,
      tokenSymbols,
      tokenDecimals,
      tokenNames,
    )
    return {
      newBalances: balances.concat(r.newBalance),
      tokenContracts,
      tokenDecimals: r.tokenDecimals,
      tokenNames: r.tokenNames,
      tokenSymbols: r.tokenSymbols,
    }
  } else {
    const newBalances = Array.from(balances)
    newBalances[balancesIndex] = {
      ...balances[balancesIndex],
      amount: await loadTokenBalance(tokenAddress, settings),
    }
    return { newBalances, tokenContracts, tokenDecimals, tokenSymbols, tokenNames, }
  }
}

async function newBalanceEntry(
  tokenContract,
  tokenAddress,
  settings,
  tokenSymbols,
  tokenDecimals,
  tokenNames,
) {
  const [ balance, decimals, name, symbol ] = await Promise.all([
    loadTokenBalance(tokenAddress, settings),
    loadTokenDecimals(tokenContract, tokenAddress, settings, tokenDecimals),
    loadTokenName(tokenContract, tokenAddress, settings, tokenNames),
    loadTokenSymbol(tokenContract, tokenAddress, settings, tokenSymbols),
  ])
  //tokenDecimals.set(tokenContract, decimals)
  //tokenNames.set(tokenContract, name)
  //tokenSymbols.set(tokenContract, symbol)

  return {
    newBalance: {
      decimals,
      name,
      symbol,
      address: tokenAddress,
      amount: balance,
      verified:
        isTokenVerified(tokenAddress, settings.network.type) ||
        addressesEqual(tokenAddress, settings.ethToken.address),
    },
    tokenDecimals,
    tokenNames,
    tokenSymbols
  }
}

function loadTokenBalance(tokenAddress, { vault }) {
  return vault.contract.balance(tokenAddress).toPromise()
}

function loadTokenDecimals(tokenContract, tokenAddress, { network }, tokenDecimals) {
  return new Promise((resolve, reject) => {
    if (tokenDecimals.has(tokenContract)) {
      resolve(tokenDecimals.get(tokenContract))
    } else {
      const fallback =
          tokenDataFallback(tokenAddress, 'decimals', network.type) || '0'
      tokenContract.decimals().subscribe(
        (decimals = fallback) => {
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

function loadTokenName(tokenContract, tokenAddress, { network }, tokenNames) {
  return new Promise((resolve, reject) => {
    if (tokenNames.has(tokenContract)) {
      resolve(tokenNames.get(tokenContract))
    } else {
      const fallback =
          tokenDataFallback(tokenAddress, 'name', network.type) || ''
      const name = getTokenName(app, tokenAddress)
      resolve(name || fallback)
    }
  })
}

function loadTokenSymbol(tokenContract, tokenAddress, { network }, tokenSymbols) {
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