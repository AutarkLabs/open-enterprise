import '@babel/polyfill'

import { getContractAddress, retryEvery } from '../../../shared/ui/utils'
import { initialize } from './store'
import { ETHER_TOKEN_FAKE_ADDRESS } from './utils/token-utils'

retryEvery(async retry => {
  const addressBookAddress = await getContractAddress('addressBook', retry)
  const vaultAddress = await getContractAddress('vault', retry)

  initialize(addressBookAddress, vaultAddress, ETHER_TOKEN_FAKE_ADDRESS)
})
