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
  console.log('vault contract: ', vaultContract)
  //vaultContract.events().subscribe(event => console.log('vault event: ', event))
  //const ETH_CONTRACT = Symbol('ETH_CONTRACT')
  //let initialState = {
  //  rewards: [],
  //  tokenContracts: new Map([[ ETHER_TOKEN_FAKE_ADDRESS, ETH_CONTRACT ]]), // Addr -> External contract
  //  tokenDecimals: new Map([[ ETH_CONTRACT, '18' ]]), // External contract -> decimals
  //  tokenNames: new Map([[ ETH_CONTRACT, 'Ether' ]]), // External contract -> name
  //  tokenSymbols: new Map([[ ETH_CONTRACT, 'ETH' ]]), // External contract -> symbol
  //}
  // Set up ETH placeholders
  //initialState.tokenContracts.set(ETHER_TOKEN_FAKE_ADDRESS, ETH_CONTRACT)
  //initialState.tokenDecimals.set(ETH_CONTRACT, '18')
  //initialState.tokenNames.set(ETH_CONTRACT, 'Ether')
  //initialState.tokenSymbols.set(ETH_CONTRACT, 'ETH')

  //console.log('initialState: ', initialState)
  return app.store(
    async (state, event) => {
      // ensure there are initial placeholder values
      //if (!state) state = initialState
      let initialState = { ...state }

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
        console.log('initial state: ', initialState,'next: ', next)
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
      of({ event: INITIALIZATION_TRIGGER }),
      //of({ event: 'test1' }),
      //of({ event: 'test2' }),
      //of({ event: 'test3' }),
      // handle vault events
      vaultContract.events(),
    ]
  )
}
