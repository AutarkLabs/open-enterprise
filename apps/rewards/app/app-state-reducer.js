import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
  RECURRING,
  ONE_TIME,
  MERIT,
  DIVIDEND
} from './utils/constants'
import {
  calculateAverageRewardsNumbers
} from './utils/metric-utils'

const CONVERT_API_BASE = 'https://min-api.cryptocompare.com/data'

const convertApiUrl = symbols =>
  `${CONVERT_API_BASE}/price?fsym=USD&tsyms=${symbols.join(',')}`

function appStateReducer(state) {

  if(state){
    state.amountTokens = state.balances.map(token => { 
      return {amount: token.amount, symbol: token.symbol, address: token.address, decimals: token.decimals}
    })
    state.rewards = state.rewards  || []
    state.claims = state.claims  || []
    state.rewards = state.rewards.map(reward => {
      if(reward.isMerit){
        reward.rewardType = ONE_TIME_MERIT
        reward.dateReference = new Date()
      } else if (reward.occurances === 1){
        reward.rewardType = ONE_TIME_DIVIDEND
      } else {
        reward.rewardType = RECURRING_DIVIDEND
      }
      const referenceAssetToken = state.amountTokens.find( token => token.address === reward.referenceToken)
      reward.referenceTokenSymbol = referenceAssetToken.symbol
      const amountToken = state.amountTokens.find( token => token.address === reward.rewardToken)
      reward.amountToken = amountToken.symbol
      return reward
    })
    state.myRewards = state.myRewards || []
    let metric = calculateAverageRewardsNumbers(state.rewards, state.claims, state.balances, updateConvertedRates(state.balances))
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
    state.myMetrics = state.myMetrics || []
    state.amountTokens = state.amountTokens || []
  }

  return {
    ...state,
  }
}

async function updateConvertedRates({ balances = [] }) {
  const verifiedSymbols = balances
    .filter(({ verified }) => verified)
    .map(({ symbol }) => symbol)

  if (!verifiedSymbols.length) {
    return
  }

  const res = await fetch(convertApiUrl(verifiedSymbols))
  const convertRates = await res.json()
  return convertRates
}

export default appStateReducer
