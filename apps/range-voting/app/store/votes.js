import { first } from 'rxjs/operators' // Make sure observables have .first and .map
//import 'rxjs/add/operator/map' // Make sure observables have .map

import { app } from './'
import { combineLatest } from '../rxjs'
import { EMPTY_CALLSCRIPT } from '../utils/vote-utils'
import { getTokenSymbol, ETHER_TOKEN_FAKE_ADDRESS } from '../utils/token-utils'


export const castVote = async (state, { voteId }) => {
  const transform = async vote => ({
    ...vote,
    data: await loadVoteData(voteId),
  })

  return updateState(state, voteId, transform)
}
  
export const executeVote = async (state, { voteId }) => {
  const transform = ({ data, ...vote }) => ({
    ...vote,
    data: { ...data, executed: true },
  })
  return updateState(state, voteId, transform)
}
  
export const startVote = async (state, { voteId }) => {
  return updateState(state, voteId, vote => vote)
}
  
/***********************
   *                     *
   *       Helpers       *
   *                     *
   ***********************/
  
const loadVoteDescription = async (vote) => {
  if (!vote.executionScript || vote.executionScript === EMPTY_CALLSCRIPT) {
    return vote
  }
  
  const path = await app.describeScript(vote.executionScript).toPromise()
  
  vote.description = path
    .map(step => {
      const identifier = step.identifier ? ` (${step.identifier})` : ''
      const app = step.name ? `${step.name}${identifier}` : `${step.to}`
  
      return `${app}: ${step.description || 'No description'}`
    })
    .join('\n')
  
  return vote
}
  
const loadVoteData = async (voteId) => {
  let vote
  return new Promise((resolve, reject) => {
    app
      .call('getVote', voteId)
      .pipe(first())
      .subscribe(async voteData => {
        let funcSig = voteData.executionScript.slice(58, 66)
        if (funcSig == 'b3670f9e') {
          resolve(loadVoteDataProjects(voteData, voteId))
        } else {
          resolve(loadVoteDataAllocation(voteData, voteId))
        }
      })
  })
}
  
// These functions arn't DRY make them better
const loadVoteDataAllocation = async (vote, voteId) => {
  return new Promise(resolve => {
    combineLatest(
      app.call('getVoteMetadata', voteId),
      app.call('getCandidateLength', voteId),
      app.call('canExecute', voteId)
    )
      .pipe(first())
      .subscribe(async ([ metadata, totalCandidates, canExecute, payout ]) => {
        const voteDescription = await loadVoteDescription(vote)
        let options = []
        for (let i = 0; i < totalCandidates; i++) {
          const candidateData = await getAllocationCandidate(voteId, i)
          options.push(candidateData)
        }
        options = await Promise.all(options)
  
        const returnObject = {
          ...marshallVote(voteDescription),
          metadata,
          canExecute,
          options,
        }
        let symbol
        const tokenAddress = '0x' + vote.executionScript.slice(794,834)
        if (tokenAddress === ETHER_TOKEN_FAKE_ADDRESS) {
          symbol = 'ETH'
        }
        else {
          symbol =  await getTokenSymbol(app, tokenAddress)
        }
  
  
        resolve({
          ...returnObject,
          // These numbers indicate the static param location of the setDistribution
          // functions amount paramater
          balance: parseInt(vote.executionScript.slice(706, 770), 16),
          tokenSymbol:  symbol,
          metadata: vote.voteDescription,
          type: 'allocation',
        })
      })
  })
}
  
const loadVoteDataProjects = async (vote, voteId) => {
  return new Promise(resolve => {
    combineLatest(
      app.call('getVoteMetadata', voteId),
      app.call('getCandidateLength', voteId),
      app.call('canExecute', voteId)
    )
      .pipe(first())
      .subscribe(async ([ metadata, totalCandidates, canExecute ]) => {
        const voteDescription = await loadVoteDescription(vote)
        let options = []
        for (let i = 0; i < totalCandidates; i++) {
          let candidateData = await getProjectCandidate(voteId, i)
          options.push(candidateData)
        }
        resolve({
          ...marshallVote(voteDescription),
          metadata: vote.voteDescription,
          type: 'curation',
          canExecute,
          options,
        })
      })
  })
}
  
const updateVotes = async  (votes, voteId, transform) => {
  const voteIndex = votes.findIndex(vote => vote.voteId === voteId)
  let nextVotes = Array.from(votes)
  if (voteIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    nextVotes = votes.concat(
      await transform({
        voteId,
        data: await loadVoteData(voteId),
      })
    )
  } else {
    nextVotes[voteIndex] = await transform(nextVotes[voteIndex])
  }
  return nextVotes
}
  
const getAllocationCandidate = async  (voteId, candidateIndex) => {
  return new Promise(resolve => {
    app
      .call('getCandidate', voteId, candidateIndex)
      .pipe(first())
      .subscribe(candidateData => {
        resolve({
          label: candidateData.candidateAddress,
          value: candidateData.voteSupport,
        })
      })
  })
}
  
const getProjectCandidate = async (voteId, candidateIndex) => {
  return new Promise(resolve => {
    app
      .call('getCandidate', voteId, candidateIndex)
      .pipe(first())
      .subscribe(candidateData => {
        resolve({
          label: candidateData.metadata,
          value: candidateData.voteSupport,
        })
      })
  })
}
  
const updateState = async  (state, voteId, transform, candidate = null) => {
  let { votes = [] } = state ? state : []
  votes = await updateVotes(votes, voteId, transform)
  return {
    ...state,
    votes: votes,
  }
}
  
const marshallVote =  ({
  open,
  creator,
  startDate,
  snapshotBlock,
  candidateSupport,
  totalVoters,
  totalParticipation,
  metadata,
  executionScript,
  executed,
}) => {
  totalVoters = parseInt(totalVoters, 10)
  totalParticipation = parseInt(totalParticipation, 10)
  return {
    open,
    creator,
    startDate: parseInt(startDate, 10) * 1000, // adjust for js time (in ms vs s)
    snapshotBlock: parseInt(snapshotBlock, 10),
    candidateSupport: parseInt(candidateSupport, 10),
    totalVoters: totalVoters,
    totalParticipation: totalParticipation,
    metadata,
    executionScript,
    executed,
    participationPct:
        totalVoters === 0 ? 0 : (totalParticipation / totalVoters) * 100,
  }
}
  