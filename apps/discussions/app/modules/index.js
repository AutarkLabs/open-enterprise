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

  compose = async () => {
    const relevantDiscussionThreads = await this._collectDiscussionThreadIds()
    const allDiscussionEvents = await this._pastEvents()
    const relevantDiscussionEvents = this._filterRelevantDiscussionEvents(
      relevantDiscussionThreads,
      allDiscussionEvents
    )
    console.log(relevantDiscussionEvents)
    return relevantDiscussionEvents
  }
}

export default Discussions
