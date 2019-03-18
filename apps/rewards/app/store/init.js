import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent, INITIALIZATION_TRIGGER } from './'
import {
  ETHER_TOKEN_FAKE_ADDRESS,
  isTokenVerified,
  tokenDataFallback,
  getTokenSymbol,
  getTokenName,
} from '../utils/token-utils'
import { of } from './rxjs'

export const initStore = (vaultAddress, network) => {
  const vaultContract = app.external(vaultAddress, vaultAbi)
  console.log(vaultContract)
  const ETH_CONTRACT = Symbol('ETH_CONTRACT')
  let initialState = {
    rewards: [],
    tokenContracts: new Map(), // Addr -> External contract
    tokenDecimals: new Map(), // External contract -> decimals
    tokenNames: new Map(), // External contract -> name
    tokenSymbols: new Map(), // External contract -> symbol
  }
  // Set up ETH placeholders
  //console.log(initialState)
  initialState.tokenContracts.set(ETHER_TOKEN_FAKE_ADDRESS, ETH_CONTRACT)
  initialState.tokenDecimals.set(ETH_CONTRACT, '18')
  initialState.tokenNames.set(ETH_CONTRACT, 'Ether')
  initialState.tokenSymbols.set(ETH_CONTRACT, 'ETH')

  console.log('initialState: ', initialState)
  return app.store(
    async (state, event) => {
      // ensure there are initial placeholder values
      if (!state) state = initialState

      try {
        const next = await handleEvent(state, event, {
          network,
          vault: {
            address: vaultAddress,
            contract: vaultContract,
          },
          ethToken: {
            address: ETHER_TOKEN_FAKE_ADDRESS,
          },
        })
        const nextState = { ...initialState, ...next }
        // Debug point
        console.log('[Rewards store]', nextState)
        return nextState
      } catch (err) {
        console.error('[Rewards script] initStore', event, err)
      }
      // always return the state even unmodified
      return state
    },
    [
      // Always initialize the store with our own home-made event
      //of({ event: INITIALIZATION_TRIGGER }),
      // handle vault events
      vaultContract.events(),
    ]
  )
}
