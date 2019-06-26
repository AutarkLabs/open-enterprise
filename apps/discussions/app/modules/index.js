import cloneDeep from 'lodash.clonedeep'
import { ipfs } from '../ipfs'

const eventTypes = new Set(['Post', 'Revise', 'Hide'])

class Discussions {
  constructor(api) {
    this.address = ''
    this.abi = []
    this.api = api
    this.contract = {}
  }

  init = async () => {
    const { abi, proxyAddress } = await this._fetchDiscussionAppInfo()
    const contract = this.api.external(proxyAddress, abi)
    this.abi = abi
    this.address = proxyAddress
    this.contract = contract
  }

  getAddress = () => this.address
  getAbi = () => this.abi
  getContract = () => this.contract

  _fetchDiscussionAppInfo = api =>
    new Promise(resolve => {
      this.api.getApps().subscribe(apps => {
        const { abi, proxyAddress } = apps.find(
          app => app.name === 'Discussions'
        )
        resolve({ abi, proxyAddress })
      })
    })

  _pastEvents = () =>
    new Promise(resolve => this.contract.pastEvents().subscribe(resolve))

  _collectDiscussionThreadIds = () =>
    new Promise(resolve => {
      this.api.getForwardedActions().subscribe(events => {
        resolve(new Set(events.returnValues.map(({ actionId }) => actionId)))
      })
    })

  _filterRelevantDiscussionEvents = (discussionThreadIds, discussionEvents) => {
    return discussionEvents.filter(
      ({ event, returnValues }) =>
        eventTypes.has(event) &&
        discussionThreadIds.has(returnValues.discussionThreadId)
    )
  }

  _handleHide = async (
    state,
    { returnValues: { discussionThreadId, postId } }
  ) => {
    const newState = cloneDeep(state)
    delete newState[discussionThreadId][postId]
    return newState
  }

  _handleRevise = async (
    state,
    {
      returnValues: {
        author,
        revisedAt,
        discussionThreadId,
        postId,
        revisedPostCid,
      },
    }
  ) => {
    const newState = cloneDeep(state)
    const {
      value: { text, revisions },
    } = await ipfs.dag.get(revisedPostCid)

    newState[discussionThreadId][postId] = {
      ...newState[discussionThreadId][postId],
      author,
      text,
      postCid: revisedPostCid,
      revisedAt,
      revisions,
    }
    return newState
  }

  _handlePost = async (
    state,
    { returnValues: { author, createdAt, discussionThreadId, postId, postCid } }
  ) => {
    const newState = cloneDeep(state)
    const {
      value: { text },
    } = await ipfs.dag.get(postCid)

    if (!newState[discussionThreadId]) newState[discussionThreadId] = {}

    newState[discussionThreadId][postId] = {
      author,
      createdAt,
      text,
      postCid,
      revisions: [],
    }
    return newState
  }

  _updateState = (state, data) => {
    if (data.event === 'Post') return this._handlePost(state, data)
    if (data.event === 'Hide') return this._handleHide(state, data)
    if (data.event === 'Revise') return this._handleRevise(state, data)
    return state
  }

  _buildState = async (state, discussionEvents) => {
    const events = cloneDeep(discussionEvents)
    // work our way backwards through the array of events recursively to avoid extra computation
    const event = events.pop()
    const newState = await this._updateState(state, event)
    if (events.length === 0) return newState
    return this._buildState(newState, events)
  }

  collect = async () => {
    const relevantDiscussionThreads = await this._collectDiscussionThreadIds()
    const allDiscussionEvents = await this._pastEvents()
    const relevantDiscussionEvents = this._filterRelevantDiscussionEvents(
      relevantDiscussionThreads,
      allDiscussionEvents
    )
    const discussionsWithData = await this._buildState(
      {},
      relevantDiscussionEvents
    )
    return discussionsWithData
  }
}

export default Discussions
