import { app } from './app'
import { ipfsAdd } from '../../../../shared/ui/utils/ipfs-helpers'

export const handleAction = async ({ votes }, { blockNumber, returnValues }) => {
  const { voteId } = returnValues
  const voteIndex = votes.findIndex(vote => vote.voteId === voteId)
  if (voteIndex === -1) return


  const { open, executed, canExecute, executionScript } = votes[voteIndex].data
  
  if (!(open || executed || canExecute )) {
    const voteDataHash = await ipfsAdd(votes[voteIndex].data)
    app.registerAppMetadata(blockNumber, voteId, voteDataHash)
    app.updateForwardedAction(voteId, blockNumber, executionScript, 'failed')
  } else if (executed) {
    app.updateForwardedAction(voteId, blockNumber, executionScript, 'completed')
  } else {
    const voteDataHash = await ipfsAdd(votes[voteIndex].data)
    app.registerAppMetadata(blockNumber, voteId, voteDataHash)
    app.newForwardedAction(voteId, blockNumber, executionScript)
  }
}

export { app } from './app'
export { handleEvent } from './events'
export { initStore } from './init'

