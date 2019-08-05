import cloneDeep from 'lodash.clonedeep'
import { ipfs } from '../ipfs'

const eventTypes = new Set(['Post', 'Revise', 'Hide'])

class Discussions {
  constructor(api) {
    this.address = ''
    this.abi = []
    this.api = api
    this.contract = {}
    this.discussions = {}
    this.lastEventBlock = -1
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

  _fetchDiscussionAppInfo = () =>
    new Promise(resolve => {
      this.api.getApps().subscribe(apps => {
        const { abi, proxyAddress } = apps.find(
          app => app.name === 'Discussions'
        )
        resolve({ abi, proxyAddress })
      })
    })

  _pastEvents = () =>
    new Promise(resolve =>
      this.contract.pastEvents().subscribe(events => {
        this.lastEventBlock = events[events.length - 1].blockNumber
        resolve(events)
      })
    )

  _collectDiscussionThreadIds = () =>
    new Promise(resolve => {
      resolve(new Set(['0', '1']))
      // this.api.getForwardedActions().subscribe(events => {
      //   resolve(new Set(events.returnValues.map(({ actionId }) => actionId)))
      // })
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
    if (events.length === 0) return state

    const event = events.shift()
    const newState = await this._updateState(state, event)
    return this._buildState(newState, events)
  }

  collect = async () => {
    const relevantDiscussionThreads = await this._collectDiscussionThreadIds()
    const allDiscussionEvents = await this._pastEvents()
    const relevantDiscussionEvents = this._filterRelevantDiscussionEvents(
      relevantDiscussionThreads,
      allDiscussionEvents
    )

    const initialState = [...relevantDiscussionThreads].reduce(
      (state, threadId) => ({ ...state, [threadId]: {} }),
      {}
    )

    this.discussions = await this._buildState(
      initialState,
      relevantDiscussionEvents
    )
    return this.discussions
  }

  listenForUpdates = callback =>
    this.contract.events(this.lastEventBlock + 1).subscribe(async event => {
      this.discussions = await this._buildState(this.discussions, [event])
      callback(this.discussions)
    })

  post = async (text, discussionThreadId, ethereumAddress) => {
    const discussionPost = {
      author: ethereumAddress,
      mentions: [],
      type: 'Post',
      text,
      revisions: [],
    }
    const result = await ipfs.dag.put(discussionPost, {})
    const cid = result.toBaseEncodedString()
    return this.contract.post(cid, discussionThreadId)
  }

  revise = async (
    text,
    discussionThreadId,
    postId,
    postCid,
    revisions,
    ethereumAddress
  ) => {
    const discussionPost = {
      author: ethereumAddress,
      mentions: [],
      type: 'Revise',
      text,
      revisions: [...revisions, postCid],
    }

    const result = await ipfs.dag.put(discussionPost, {})
    const cid = result.toBaseEncodedString()

    return this.contract.revise(cid, postId, discussionThreadId)
  }

  hide = (postId, discussionThreadId) =>
    this.contract.hide(postId, discussionThreadId)
}

export default Discussions
