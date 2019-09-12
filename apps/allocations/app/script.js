/* eslint-disable import/no-unused-modules */
import '@babel/polyfill'

import { getContractAddress, retryEvery } from '../../../shared/ui/utils'
import { initialize } from './store'
import { ETHER_TOKEN_FAKE_ADDRESS } from './utils/token-utils'

retryEvery(async retry => {
  const vaultAddress = await getContractAddress('vault', retry)

  initialize(vaultAddress, ETHER_TOKEN_FAKE_ADDRESS)
})
