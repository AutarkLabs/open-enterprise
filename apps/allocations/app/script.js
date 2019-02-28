import '@babel/polyfill'

import { retryEvery } from '../../shared/ui'
import { app, initStore } from './store'

retryEvery(async retry => {
  // get deployed address book address from contract
  const addressBookAddress = await app
    .call('addressBook')
    .first()
    .toPromise()

  initStore(addressBookAddress).catch(err => {
    console.error('[Allocations] worker failed', err)
    retry()
  })
})
