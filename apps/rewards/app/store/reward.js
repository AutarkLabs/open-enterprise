import { first, map } from 'rxjs/operators' // Make sure observables have .first
import BigNumber from 'bignumber.js'
import { app } from './'
import { blocksToMilliseconds } from '../../../../shared/ui/utils'

export async function onRewardAdded({ rewards = [] }, { rewardId }) {
  if (!rewards[rewardId]) {
    rewards[rewardId] = await getRewardById(rewardId)
  }

  return { rewards }
}

/////////////////////////////////////////
/*      rewards helper functions       */
/////////////////////////////////////////

const getRewardById = async rewardId => {
  const currentBlock = await app.web3Eth('getBlockNumber').toPromise()
  console.log('current Block: ', currentBlock)

  return await app.call('getReward', rewardId)
    .pipe(
      first(),
      map(data => ({
        rewardId,
        description: data.description,
        isMerit: data.isMerit,
        referenceToken: data.referenceToken,
        rewardToken: data.rewardToken,
        amount: data.amount,
        startBlock: data.startBlock,
        endBlock: data.endBlock,
        duration: data.duration,
        delay: data.delay,
        startDate: Date.now() + blocksToMilliseconds(currentBlock,data.startBlock),
        endDate: Date.now() + blocksToMilliseconds(currentBlock, data.endBlock),
        userRewardAmount: data.rewardAmount,
        claimed: data.claimed,
        timeClaimed: data.timeClaimed,
      }))
    )
    .toPromise()
}
