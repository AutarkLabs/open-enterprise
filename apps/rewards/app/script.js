import '@babel/polyfill'

import { first } from 'rxjs/operators'
import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'

retryEvery(async retry => {
  // get deployed vault address from contract
  const vaultAddress = await app
    .call('vault')
    .pipe(first())
    .toPromise()

  const network = await app
    .network()
    .pipe(first())
    .toPromise()

  initStore(vaultAddress, network)
})
