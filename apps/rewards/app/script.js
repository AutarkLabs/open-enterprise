import '@babel/polyfill'

import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'
import { first } from 'rxjs/operators'

retryEvery(async retry => {
  // get deployed vault address from contract
  const vaultAddress = await app
    .call('vault')
    .first()
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
