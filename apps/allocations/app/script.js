import '@babel/polyfill'

import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'
import { first } from 'rxjs/operators'

retryEvery(async retry => {
  // get deployed address book address from contract
  const addressBookAddress = await app
    .call('addressBook')
    .first()
    .toPromise()

  const network = await app
    .network()
    .pipe(first())
    .toPromise()


  const vaultAddress = await app
    .call('vault')
    .first()
    .toPromise()

  initStore(vaultAddress, network, addressBookAddress).catch(err => {
    console.error('[Allocations] worker failed', err)
    retry()
  })
})
