import { app } from './app'

export const handleAction = ({ votes }, { blockNumber, returnValues }) => {
  const { voteId } = returnValues
  const voteIndex = votes.findIndex(vote => vote.voteId === voteId)
  if (voteIndex === -1) return


  const { open, executed, canExecute, executionScript } = votes[voteIndex].data
  if (!(open || executed || canExecute )) {
    app.updateForwardedAction(voteId, blockNumber, executionScript, 'failed')
  } else if (executed) {
    app.updateForwardedAction(voteId, blockNumber, executionScript, 'completed')
  } else {
    app.newForwardedAction(voteId, blockNumber, executionScript)
  }
}

export { app } from './app'
export { handleEvent } from './events'
export { initStore } from './init'

