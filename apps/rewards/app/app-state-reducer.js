import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
  MONTHS,
  DAYS,
  YEARS,
  WEEKS,
} from './utils/constants'
import {
  calculateAverageRewardsNumbers,
  calculateMyRewardsSummary
} from './utils/metric-utils'
import { MILLISECONDS_IN_A_MONTH, MILLISECONDS_IN_A_WEEK, MILLISECONDS_IN_A_YEAR, MILLISECONDS_IN_A_DAY } from '../../../shared/ui/utils/math-utils'

function appStateReducer(state) {

  if(state){
    state.amountTokens = state.balances.map(token => {
      return { amount: token.amount, symbol: token.symbol, address: token.address, decimals: token.decimals }
    })
    state.rewards = state.rewards  || []
    state.claims = state.claims  || []
    state.rewards = state.rewards === [] ? [] : state.rewards.reduce((rewards, reward) => {
      const currentReward = rewards.find(filteredElement => {
        return filteredElement.description === reward.description && parseInt(filteredElement.rewardId, 10) + filteredElement.occurances === parseInt(reward.rewardId)
      })
      if(currentReward !== undefined){
        currentReward.occurances += 1
        currentReward.rewardType = RECURRING_DIVIDEND
        currentReward.disbursements.push(new Date(reward.endDate))
        const durationInBlocks = currentReward.duration*15000
        if (durationInBlocks % MILLISECONDS_IN_A_YEAR ===0) {
          currentReward.disbursementUnit = YEARS
          currentReward.disbursement = durationInBlocks / MILLISECONDS_IN_A_YEAR
        } else if(durationInBlocks % MILLISECONDS_IN_A_MONTH ===0){
          currentReward.disbursementUnit = MONTHS
          currentReward.disbursement = durationInBlocks / MILLISECONDS_IN_A_MONTH
        } else if(durationInBlocks % MILLISECONDS_IN_A_WEEK ===0){
          currentReward.disbursementUnit = WEEKS
          currentReward.disbursement = durationInBlocks / MILLISECONDS_IN_A_WEEK
        }   else if(durationInBlocks % MILLISECONDS_IN_A_DAY ===0){
          currentReward.disbursementUnit = DAYS
          currentReward.disbursement = durationInBlocks / MILLISECONDS_IN_A_DAY
        }
      } else {
        reward.occurances = 1
        reward.disbursements = [new Date(reward.endDate)]
        reward.claimed = reward.timeClaimed !== '0'
        if(reward.isMerit){
          reward.rewardType = ONE_TIME_MERIT
          reward.dateReference = new Date()
        } else {
          reward.rewardType = ONE_TIME_DIVIDEND
          reward.dateReference = new Date(reward.endDate)
        }
        const referenceAssetToken = state.amountTokens.find( token => token.address === reward.referenceToken)
        reward.referenceTokenSymbol = referenceAssetToken.symbol
        const amountToken = state.amountTokens.find( token => token.address === reward.rewardToken)
        reward.amountToken = amountToken.symbol
        rewards.push(reward)
      }
      return rewards
    }, [])
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
  }

  return {
    ...state,
  }
}

export default appStateReducer
