/* eslint-disable import/no-unused-modules */
import '@babel/polyfill'

import { getContractAddress, retryEvery } from '../../../shared/ui/utils'
import { initStore } from './store'
import { app } from './store'

retryEvery(async retry => {
  const vaultAddress = await getContractAddress('vault', retry)
  const standardBountiesAddress = await app.call('bountiesRegistry').toPromise()

  initStore(vaultAddress, standardBountiesAddress)
})
