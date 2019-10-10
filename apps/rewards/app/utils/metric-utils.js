import BigNumber from 'bignumber.js'
import { MILLISECONDS_IN_A_MONTH } from '../../../../shared/ui/utils/math-utils'

export const calculateAverageRewardsNumbers = ( rewards, claims, balances, convertRates ) => {
  if (Object.keys(claims).length > 0 && balances && convertRates) {
    return [
      (calculateAvgClaim(claims, balances, convertRates), '$'),
      (calculateMonthlyAvg(rewards, balances, convertRates), '$'),
      (calculateYTDRewards(rewards,balances, convertRates), '$'),
    ]
  }
  else {
    return Array(3).fill(0, '$')
  }
}

const calculateAvgClaim = ({ claimsByToken, totalClaimsMade }, balances, convertRates) => {
  return sumTotalRewards(
    claimsByToken,
    balances,
    convertRates,
    (claim, bal) => claim.address === bal.address
  ) / totalClaimsMade
}

const calculateMonthlyAvg = (rewards, balances, convertRates) => {
  let monthCount = Math.ceil((Date.now() - rewards.reduce((minDate, reward) => {
    return reward.endDate < minDate.endDate ? reward: minDate
  }).endDate) / MILLISECONDS_IN_A_MONTH)

  return sumTotalRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => rew.rewardToken === bal.address
  ) / monthCount
}

const calculateYTDRewards = (rewards, balances, convertRates) => {
  const yearBeginning = new Date(new Date(Date.now()).getFullYear(), 0)
  return sumTotalRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => rew.rewardToken === bal.address && rew.endDate >= yearBeginning
  )
}

const sumTotalRewards = (rewards, balances, convertRates, rewardFilter) => {
  return balances.reduce((balAcc, balance) => {
    if (convertRates[balance.symbol]) {
      return rewards.reduce((rewAcc,reward) => {
        return (rewardFilter(reward, balance))
          ?
          BigNumber(reward.amount).div(Math.pow(10, balance.decimals)).div(convertRates[balance.symbol]).plus(rewAcc)
            .toNumber()
          :
          rewAcc
      },0) + balAcc
    }
    else return balAcc
  },0)
}

export const calculateMyRewardsSummary = (rewards, balances, convertRates) => {
  if (balances && convertRates) {
    return [
      calculateUnclaimedRewards(rewards, balances, convertRates),
      calculateAllRewards(rewards, balances, convertRates),
      calculateYTDUserRewards(rewards, balances, convertRates)
    ]
  }
  else {
    return Array(3).fill(0)
  }
}

const calculateUnclaimedRewards = (rewards, balances, convertRates) => {
  return sumUserRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => !rew.claimed && rew.rewardToken === bal.address // rewardFilter
  )
}

const calculateAllRewards = (rewards, balances, convertRates) => {
  console.log('Calcualte All Rewards Info:', rewards, balances, convertRates)
  return sumUserRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => rew.claimed && rew.rewardToken === bal.address, // RewardFilter
  )
}

const calculateYTDUserRewards = (rewards, balances, convertRates) => {
  const yearBeginning = new Date(new Date(Date.now()).getFullYear(), 0)
  return sumUserRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => rew.claimed && rew.rewardToken === bal.address && rew.endDate >= yearBeginning
  )
}

const sumUserRewards = (rewards, balances, convertRates, rewardFilter) => {
  return balances.reduce((balAcc, balance) => {
    if (convertRates[balance.symbol]) {
      return rewards.reduce((rewAcc,reward) => {
        return (rewardFilter(reward, balance))
          ?
          BigNumber(reward.userRewardAmount).div(Math.pow(10, balance.decimals)).div(convertRates[balance.symbol]).plus(rewAcc)
            .toNumber()
          :
          rewAcc
      },0) + balAcc
    }
    else return balAcc
  },0)
}