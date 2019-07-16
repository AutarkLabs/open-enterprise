import '@babel/polyfill'

import { getContractAddress, retryEvery } from '../../../shared/ui/utils'
import { initStore } from './store'

retryEvery(async retry => {
  const vaultAddress = await getContractAddress('vault', retry)

  initStore(vaultAddress)
})
