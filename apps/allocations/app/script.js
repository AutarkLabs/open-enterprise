import '@babel/polyfill'

import { first } from 'rxjs/operators'
import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'

retryEvery(async () => {
  // get deployed address book address from contract
  const addressBookAddress = await app
    .call('addressBook')
    .pipe(first())
    .toPromise()

  const network = await app
    .network()
    .pipe(first())
    .toPromise()


  const vaultAddress = await app
    .call('vault')
    .pipe(first())
    .toPromise()

  initStore(vaultAddress, network, addressBookAddress)
})
