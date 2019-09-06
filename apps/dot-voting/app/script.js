/* eslint-disable import/no-unused-modules */
import '@babel/polyfill'

import { first } from 'rxjs/operators'
import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'

retryEvery(async () => {
  // get deployed contacts address from contract
  const contactsAddress = await app
    .call('contacts')
    .pipe(first())
    .toPromise()


  initStore(contactsAddress)
})

