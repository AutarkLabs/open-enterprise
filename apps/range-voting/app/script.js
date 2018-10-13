import Aragon from '@aragon/client'
import { combineLatest } from './rxjs'
import voteSettings, { hasLoadedVoteSettings } from './utils/vote-settings'
import { EMPTY_CALLSCRIPT } from './utils/vote-utils'

const app = new Aragon()
let appState = {
  votes: []
}
app.events().subscribe(handleEvents)
app.state().subscribe( (state) => {
  appState = state
})

async function handleEvents(response){
  let nextState = appState
  switch (response.event) {
    case 'CastVote':
      console.info('[RangeVoting > script]: received CastVote')
      nextState = await castVote(nextState, response.returnValues)
      break
    case 'ExecuteVote':
      console.info('[RangeVoting > script]: received ExecuteVote')

      nextState = await executeVote(nextState, response.returnValues)
      break
    case 'StartVote':
      console.info('[RangeVoting > script]: received StartVote')
      nextState = await startVote(nextState, response.returnValues)
      break
    case 'AddCandidate':
      console.info('[RangeVoting > script]: received AddCandidate')
      nextState = await addCandidate(nextState, response.returnValues)
      break
    default:
      break
  }
  console.log('[RangeVoting > script]: end state')
  console.log(nextState)  
  app.cache('state', nextState)
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function castVote(state, { voteId }) {
  // Let's just reload the entire vote again,
  // cause do we really want more than one source of truth with a blockchain?
  const transform = async vote => ({
    ...vote,
    data: await loadVoteData(voteId),
  })
  return updateState(state, voteId, transform)
}

async function executeVote(state, { voteId }) {
  const transform = ({ data, ...vote }) => ({
    ...vote,
    data: { ...data, executed: true },
  })
  return updateState(state, voteId, transform)
}

async function startVote(state, { voteId }) {
  return updateState(state, voteId, vote => vote)
}

async function addCandidate(state, { voteId, candidate}) {
  return updateState(state, voteId, vote => vote, candidate)
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function loadVoteDescription(vote) {
  if (!vote.executionScript || vote.executionScript === EMPTY_CALLSCRIPT) {
    console.info(
      '[RangeVoting > script] loadVoteDescription: No description found for:',
      vote
    )
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

function loadVoteData(voteId) {
  console.info('[RangeVoting > script]: loadVoteData')
  return new Promise(resolve => {
    combineLatest(
      app.call('getVote', voteId),
      app.call('getVoteMetadata', voteId)
    )
      .first()
      .subscribe(([vote, metadata]) => {
        loadVoteDescription(vote).then(vote => {
          resolve({
            ...marshallVote(vote),
            metadata,
          })
        })
      })
  })
}

async function updateVotes(votes, voteId, transform) {
  const voteIndex = votes.findIndex(vote => vote.voteId === voteId)
  if (voteIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    return votes.concat(
      await transform({
        voteId,
        data: await loadVoteData(voteId),
      })
    )
  } else {
    const nextVotes = Array.from(votes)
    let options = nextVotes[voteIndex].data.options
    nextVotes[voteIndex] = await transform(nextVotes[voteIndex])
    nextVotes[voteIndex].data.options = options
    return nextVotes
  }
}

async function updateCandidate(votes, voteId, candidate) {
  const voteIndex = votes.findIndex(vote => vote.voteId === voteId)
  let nextVotes
  if (voteIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    nextVotes = Array.from(votes)
    nextVotes.push(
      {
        voteId,
        data: {
          options: {
            label: candidate,
            value: 0
          }
        }
      }
    )
  } else {
    nextVotes = Array.from(votes)
    if(nextVotes[voteIndex].data.options === undefined){
      nextVotes[voteIndex].data.options = []
    }
    nextVotes[voteIndex].data.options.push({
      label: candidate,
      value: 0
    })
  }
  return nextVotes  
}

async function updateState(state, voteId, transform, candidate = null) {
  let { votes = [] } = state ? state : []
  if(candidate != null){
    votes = await updateCandidate(votes, voteId, candidate)
  } else {
    votes = await updateVotes(votes, voteId, transform)
  }
  return {
    ...state,
    votes: votes,
  }
}

function loadVoteSettings() {
  return Promise.all(
    voteSettings.map(
      ([name, key, type = 'string']) =>
        new Promise((resolve, reject) =>
          app
            .call(name)
            .first()
            .map(val => {
              if (type === 'number') {
                return parseInt(val, 10)
              }
              if (type === 'time') {
                // Adjust for js time (in ms vs s)
                return parseInt(val, 10) * 1000
              }
              return val
            })
            .subscribe(value => {
              resolve({ [key]: value })
            }, reject)
        )
    )
  )
    .then(settings =>
      settings.reduce((acc, setting) => ({ ...acc, ...setting }), {})
    )
    .catch(err => {
      console.error('[RangeVoting > script] Failed to load Vote settings', err)
      // Return an empty object to try again later
      return {}
    })
}

// Apply transmations to a vote received from web3
// Note: ignores the 'open' field as we calculate that locally
function marshallVote({
  open,
  creator,
  startDate,
  snapshotBlock,
  candidateSupport,
  totalVoters,
  totalParticipation,
  totalCandidates,
  options,
  metadata,
  executionScript,
  executed,
}) {
  options = options ? options: []
  let voteData = {}
  return {
    open,
    creator,
    startDate: parseInt(startDate, 10) * 1000, // adjust for js time (in ms vs s)
    snapshotBlock: parseInt(snapshotBlock, 10),
    candidateSupport: parseInt(candidateSupport, 10),
    totalVoters: parseInt(totalVoters, 10),
    totalParticipation: parseInt(totalParticipation, 10),
    totalCandidates:  parseInt(totalParticipation, 10),
    options,
    metadata,
    executionScript,
    executed,
  }
}
