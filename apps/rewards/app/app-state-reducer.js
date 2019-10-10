import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
} from './utils/constants'
import {
  calculateAverageRewardsNumbers,
  calculateMyRewardsSummary
} from './utils/metric-utils'

function appStateReducer(state) {

  if(state){
    state.amountTokens = state.balances.map(token => {
      return { amount: token.amount, symbol: token.symbol, address: token.address, decimals: token.decimals }
    })
    state.rewards = state.rewards  || []
    state.claims = state.claims  || []
    state.rewards = state.rewards.map(reward => {
      reward.claimed = reward.timeClaimed !== '0'
      if(reward.isMerit){
        reward.rewardType = ONE_TIME_MERIT
        reward.dateReference = new Date()
      } else if (reward.occurances.toString() === '1'){
        reward.rewardType = ONE_TIME_DIVIDEND
        reward.dateReference = new Date(reward.endDate)
      } else {
        reward.rewardType = RECURRING_DIVIDEND
      }
      const referenceAssetToken = state.amountTokens.find( token => token.address === reward.referenceToken)
      reward.referenceTokenSymbol = referenceAssetToken.symbol
      const amountToken = state.amountTokens.find( token => token.address === reward.rewardToken)
      reward.amountToken = amountToken.symbol
      return reward
    })
    state.myRewards = state.rewards.filter(reward => reward.userRewardAmount > 0)
    const metric = calculateAverageRewardsNumbers(state.rewards, state.claims, state.balances, state.convertRates)
    state.metrics = [
      {
        name: 'Average reward',
        value: metric[0].toString(),
        unit: 'USD',
      },
      {
        name: 'Monthly average',
        value: metric[1].toString(),
        unit: 'USD',
      },
      {
        name: 'Annual total',
        value: metric[2].toString(),
        unit: 'USD',
      },
    ]
    const myMetric = calculateMyRewardsSummary(state.rewards, state.balances, state.convertRates)
    state.myMetrics = [
      {
        name: 'Unclaimed rewards',
        value: myMetric[0].toString(),
        unit: 'USD',
      },
      {
        name: 'All time rewards obtained',
        value: myMetric[1].toString(),
        unit: 'USD',
      },
      {
        name: 'Rewards obtained this year',
        value: myMetric[2].toString(),
        unit: 'USD',
      },
    ]
    state.amountTokens = state.amountTokens || []
    console.log('end reducers:', state)
  }

  return {
    ...state,
  }
}

export default appStateReducer
