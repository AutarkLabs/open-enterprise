import { app } from '.'
import { first } from 'rxjs/operators'

export const getContractAddress = async (contractName, retry) => {
  try {
    const contractNameAddress = await app
      .call(contractName)
      .pipe(first())
      .toPromise()
    return contractNameAddress
  } catch (error) {
    console.error(
      `Could not start script due to contract not loading ${contractName}`,
      err
    )
    retry()
  }
}
