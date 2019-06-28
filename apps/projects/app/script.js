import '@babel/polyfill'

import { first } from 'rxjs/operators'
import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'

retryEvery(async () => {
  // get deployed vault address from contract
  const vaultAddress = await app
    .call('vault')
    .pipe(first())
    .toPromise()

  initStore(vaultAddress)
})
