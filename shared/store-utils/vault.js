import { getContractAddress, retryEvery } from '.'
import vaultBalanceAbi from '../json-abis/vault/vault-balance.json'
import vaultGetInitializationBlockAbi from '../json-abis/vault/vault-getinitializationblock.json'
import vaultEventAbi from '../json-abis/vault/vault-events.json'

const vaultAbi = [].concat(
  vaultBalanceAbi,
  vaultGetInitializationBlockAbi,
  vaultEventAbi
)

export const getVault = async () =>
  retryEvery(async retry => {
    const address = await getContractAddress('vault', retry)
    const contract = app.external(address, vaultAbi)
    let initializationBlock

    try {
      initializationBlock = await contract.getInitializationBlock().toPromise()
    } catch (err) {
      console.error('could not get attached vault´s initialization block', err)
    }

    return { address, contract, initializationBlock }
  })
