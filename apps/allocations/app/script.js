import '@babel/polyfill'

import 'rxjs/add/operator/first' // Make sure observables have .first
import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'

retryEvery(async retry => {
  // get deployed address book address from contract
  const addressBookAddress = await app
    .call('addressBook')
    .pipe(first())
    .toPromise()

  initStore(addressBookAddress).catch(err => {
    console.error('[Allocations] worker failed', err)
    retry()
  })
})
