import '@babel/polyfill'

import 'rxjs/add/operator/first' // Make sure observables have .first

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

  initStore(vaultAddress, network).catch(err => {
    console.error('[Rewards] worker failed', err)
    retry()
  })
})
