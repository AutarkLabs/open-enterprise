import '@babel/polyfill'

import { retryEvery } from '../../../shared/ui/utils'
import { initStore } from './store'

retryEvery(async () => {
  initStore()
})


