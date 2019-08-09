import AddressBookJSON from '../../../shared/json-abis/address-book.json'
import { app, handleEvent } from './'
import { first } from 'rxjs/operators'

import { initializeTokens } from './token'
import vaultBalanceAbi from '../../../shared/json-abis/vault/vault-balance.json'
import vaultGetInitializationBlockAbi from '../../../shared/json-abis/vault/vault-getinitializationblock.json'
import vaultEventAbi from '../../../shared/json-abis/vault/vault-events.json'

const vaultAbi = [].concat(
  vaultBalanceAbi,
  vaultGetInitializationBlockAbi,
  vaultEventAbi
)

const initialState = { accounts: [], entries: [], payouts: [] }

export const initialize = async (
  addressBookAddress,
  vaultAddress,
  ethAddress
) => {
  const addressBookContract = app.external(
    addressBookAddress,
    AddressBookJSON.abi
  )
  const vaultContract = app.external(vaultAddress, vaultAbi)

  const network = await app
    .network()
    .pipe(first())
    .toPromise()

  return createStore({
    network,
    addressBook: {
      address: addressBookAddress,
      contract: addressBookContract,
    },
    ethToken: {
      address: ethAddress,
    },
    vault: {
      address: vaultAddress,
      contract: vaultContract,
    },
  })
}

const createStore = async settings => {
  let vaultInitializationBlock

  try {
    vaultInitializationBlock = await settings.vault.contract
      .getInitializationBlock()
      .toPromise()
  } catch (err) {
    console.error(
      '[allocations script] could not get attached vault\'s initialization block',
      err
    )
  }

  return app.store(
    async (state, event) => {
      const prevState = state || initialState
      let nextState
      try {
        nextState = await handleEvent(prevState, event, settings)
      } catch (err) {
        console.error('[allocations script] initStore', event, err)
      }
      // always return the state even unmodified
      return nextState
    },
    {
      externals: [
        settings.addressBook.contract,
        settings.vault.contract,

      ],
      init: initState(settings)
    }
  )
}

const initState = (settings) => async (cachedState) => {
  const nextState = await initializeTokens(cachedState, settings)
  return nextState
}
