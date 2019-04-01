import '@babel/polyfill'

import { first } from 'rxjs/operators'
import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'

retryEvery(async retry => {
  // get deployed address book address from contract
  const addressBookAddress = await app
    .call('addressBook')
    .pipe(first())
    .toPromise()

  initStore(addressBookAddress)
})
