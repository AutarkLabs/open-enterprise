import { first, map } from 'rxjs/operators'
import { app } from './'

export async function onRewardAdded({ rewards = [] }, { rewardId }) {
  if (!rewards[rewardId]) {
    rewards[rewardId] = await getRewardById(rewardId)
  }

  return { rewards }
}

/////////////////////////////////////////
/*      rewards helper functions       */
/////////////////////////////////////////

const rewardTransform = data => ({
  rewardId,
  isMerit: data.isMerit,
  referenceToken: data.referenceToken,
  rewardToken: data.rewardToken,
  amount: data.amount,
  endBlock: data.EndBlock,
  delay: data.delay,
})

const getRewardById = async rewardId => {
  return await app
    .call('getReward', rewardId)
    .pipe(
      first(),
      map(rewardTransform)
    )
    .toPromise()
}
