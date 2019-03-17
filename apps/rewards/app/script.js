import '@babel/polyfill'

import { retryEvery } from '../../../shared/ui/utils'
import { app, initStore } from './store'

retryEvery(async retry => {
  // get deployed vault address from contract
  const vaultAddress = await app
    .call('vault')
    .first()
    .toPromise()

  initStore(vaultAddress).catch(err => {
    console.error('[Rewards] worker failed', err)
    retry()
  })
})
