import Aragon from '@aragon/api'
import { combineLatest } from 'rxjs'
import { first, map, tap, combineAll } from 'rxjs/operators' // Make sure observables have first()
import voteSettings, { hasLoadedVoteSettings } from './utils/vote-settings'
import AddressBookJSON from '../../shared/json-abis/address-book.json'
import { EMPTY_CALLSCRIPT } from './utils/vote-utils'
import AllocationJSON from '../../shared/json-abis/allocations.json'

const app = new Aragon()
let appState = {
  votes: [],
  entries: {}
}
let addressBook, allocations, nextEntries
app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  appState = state ? state : { accounts: [], entries: {} }
  if (!addressBook) {
    // this should be refactored to be a "setting"
    app.call('addressBook').subscribe(response => {
      addressBook = app.external(response, AddressBookJSON.abi)
      addressBook.events().subscribe(handleEvents)
    })
  }
})
async function handleEvents(response) {
  let nextState = {
    ...appState,
    ...(!hasLoadedVoteSettings(appState) ? await loadVoteSettings() : {}),
  }
  const { entries } = appState
  switch (response.event) {
  case 'CastVote':
    console.info('[RangeVoting > script]: received CastVote')
    nextState = await castVote(nextState, response.returnValues)
    break
  case 'ExecutionScript':
    console.info('[RangeVoting > script]: received ExecutionScript')
    console.info(response.returnValues)
    break
  case 'ExecuteVote':
    console.info('[RangeVoting > script]: received ExecuteVote')

    nextState = await executeVote(nextState, response.returnValues)
    break
  case 'StartVote':
    console.info('[RangeVoting > script]: received StartVote')
    nextState = await startVote(nextState, response.returnValues)
    break
  case 'ExternalContract':
    let funcSig = response.returnValues.funcSig
    console.info('[RangeVoting > script]: received ExternalContract', funcSig)
    // Should actually be a case-switch
    if (funcSig.slice(58) == 'f2122136') {
      console.log('Loading Projects Data')
    } else {
      console.log('Loading Allocations Contract')
      allocations = app.external(
        response.returnValues.addr,
        AllocationJSON.abi
      )
    }
  case 'EntryAdded':
    nextEntries = await onEntryAdded(entries, response.returnValues)
    break
  case 'EntryRemoved':
    nextEntries = await onEntryRemoved(entries, response.returnValues)
  default:
    break
  }
  console.log('[RangeVoting > script]: end state')
  // If nextAccounts or nextEntries were not generated
  // then return each original array
  const filteredState = {
    ...nextState,
    entries: entries,
  }
  appState = filteredState
  app.cache('state', filteredState)
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

async function loadVoteData(voteId) {
  console.info('[RangeVoting > script]: loadVoteData', voteId)
  let vote
  return new Promise((resolve, reject) => {
    app
      .call('getVote', voteId)
      .pipe(first())
      .subscribe(async voteData => {
        let funcSig = voteData.executionScript.slice(58, 66)
        if (funcSig == 'b3670f9e') {
          console.log('Loading Projects Data')
          resolve(loadVoteDataProjects(voteData, voteId))
        } else {
          console.log('Loading Allocations Data')
          resolve(loadVoteDataAllocation(voteData, voteId))
        }
      })
  })
}

// These functions arn't DRY make them better
function loadVoteDataAllocation(vote, voteId) {
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

        allocations.getPayout(voteDescription.externalId)
          .pipe(first())
          .subscribe(payout => (resolve({
            ...returnObject,
            limit: parseInt(payout.limit, 10),
            balance: parseInt(voteDescription.executionScript.slice(706, 770), 16),
            metadata:
                'Range Vote ' +
                voteId +
                ' - Allocation (' +
                payout.metadata +
                ')',
          })))
      })
  })
}

// These functions arn't DRY make them better
async function loadVoteDataProjects(vote, voteId) {
  return new Promise(resolve => {
    combineLatest(
      app.call('getVoteMetadata', voteId),
      app.call('getCandidateLength', voteId),
      app.call('canExecute', voteId)
    )
      .pipe(first())
      .subscribe(async ([ metadata, totalCandidates, canExecute ]) => {
        console.log('projects data:', metadata, totalCandidates, canExecute)
        const voteDescription = await loadVoteDescription(vote)
        let options = []
        for (let i = 0; i < totalCandidates; i++) {
          let candidateData = await getProjectCandidate(voteId, i)
          options.push(candidateData)
        }
        resolve({
          ...marshallVote(voteDescription),
          metadata: 'Range Vote ' + voteId + ' - Issue Curation',
          canExecute,
          options,
        })
      })
  })
}

async function updateVotes(votes, voteId, transform) {
  const voteIndex = votes.findIndex(vote => vote.voteId === voteId)
  let nextVotes = Array.from(votes)
  if (voteIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    console.log('Vote Not Found')
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

async function getAllocationCandidate(voteId, candidateIndex) {
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

async function getProjectCandidate(voteId, candidateIndex) {
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

async function updateState(state, voteId, transform, candidate = null) {
  let { votes = [] } = state ? state : []
  votes = await updateVotes(votes, voteId, transform)
  return {
    ...state,
    votes: votes,
  }
}

function loadVoteSettings() {
  return Promise.all(
    voteSettings.map(
      ([ name, key, type = 'string' ]) =>
        new Promise((resolve, reject) =>
          app
            .call(name)
            .pipe(
              first(),
              map(val => {
                if (type === 'number') {
                  return parseInt(val, 10)
                }
                if (type === 'time') {
                // Adjust for js time (in ms vs s)
                  return parseInt(val, 10) * 1000
                }
                return val
              })
            )
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
      console.error('Failed to load Vote settings', err)
      // Return an empty object to try again later
      return {}
    })
}

/** AddressBook management */
const onEntryAdded = async (entries, { addr }) => {
  // is addr already in the state?
  if (entries && entries[addr]) {
    // entry already cached, do nothing
    console.log('[RangeVoting script]', addr, 'already cached')
  } else {
    // entry not cached
    const data = await loadEntryData(addr) // async load data from contract
    const entry = { addr, data } // transform for the frontend to understand
    entries[addr] = entry // add to the state object received as param
    console.log('[RangeVoting script] caching new contract entry', entries)
    // console.log('[AddressBook script] at position', addedIndex) // in case we need the index
  }
  return entries // return the (un)modified entries array
}

const onEntryRemoved = async (entries = [], { addr }) => {
  if(entries[addr]) delete entries[addr]
  return entries // return the (un)modified entries array
}

/***********************
 *     AddressBook     *
 *       Helpers       *
 ***********************/
const loadEntryData = async addr => {
  return new Promise(resolve => {
    // this is why we cannot import methods without binding proxy caller
    addressBook.getEntry(addr).subscribe(entry => {
      // don't resolve when entry not found
      entry &&
        resolve({
          entryAddress: entry[0],
          name: entry[1],
          entryType: entry[2],
        })
    })
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
  metadata,
  executionScript,
  executed,
}) {
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
