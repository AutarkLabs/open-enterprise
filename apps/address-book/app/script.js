import Aragon, { providers } from '@aragon/client'
import { combineLatest } from './rxjs'

const app = new Aragon()

// Hook up the script as an aragon.js store
app.store(async (state, { event, returnValues }) => {
  let nextState = {
    ...state,
    // Fetch the app's settings, if we haven't already
    //...(!hasLoadedVoteSettings(state) ? await loadVoteSettings() : {}),
  }

  switch (event) {
  case 'NewPayout':
    nextState = await newPayout(nextState, returnValues)
    break
  }

  return nextState
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function newPayout(state, { payoutId }) {
  const transform = ({ data, ...payout }) => ({
    ...payout,
    data: { ...data, executed: true },
  })
  return updateState(state, payoutId, transform)
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function loadPayoutData(payoutId) {
  return new Promise(resolve => {
    combineLatest(app.call('getPayout', payoutId)).subscribe(
      ([payout, metadata]) => {}
    )
  })
}

async function updatePayouts(payouts, payoutId, transform) {
  const payoutIndex = payouts.findIndex(payout => payout.payoutId === payoutId)

  if (payoutIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    return payouts.concat(
      await transform({
        payoutId,
        data: await loadPayoutData(payoutId),
      })
    )
  } else {
    const nextPayouts = Array.from(payouts)
    nextPayouts[payoutIndex] = await transform(nextPayouts[payoutIndex])
    return nextPayouts
  }
}

async function updateState(state, payoutId, transform) {
  const { payouts = [] } = state

  return {
    ...state,
    payouts: await updatePayouts(payouts, payoutId, transform),
  }
}

// Apply transmations to a vote received from web3
// Note: ignores the 'open' field as we calculate that locally
//
