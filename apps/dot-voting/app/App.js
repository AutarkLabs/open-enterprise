import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { EmptyStateCard, Header, Main } from '@aragon/ui'
import { useAragonApi } from './api-react'
import { isBefore } from 'date-fns'
import { getTotalSupport } from './utils/vote-utils'
import { safeDiv } from './utils/math-utils'
import { IdentityProvider } from './components/LocalIdentityBadge/IdentityManager'
import Decisions from './Decisions'
import emptyStatePng from './assets/voting-empty-state.png'

const ASSETS_URL = './aragon-ui'

const illustration = <img src={emptyStatePng} alt="" height="160" />

const useVoteCloseWatcher = () => {
  const { votes = [], voteTime = 0 } = useAragonApi().appState
  const [ now, setNow ] = useState(new Date().getTime())

  useEffect(() => {
    const timeouts = {}

    votes.forEach(({ voteId: id, data: { startDate } }) => {
      const endTime = new Date(startDate + voteTime).getTime()

      if (endTime < now) return // ignore; voting has closed

      timeouts[id] = setTimeout(
        () => setNow(new Date().getTime()),
        endTime - now
      )
    })

    return function cleanup() {
      for (let id in timeouts) {
        clearTimeout(timeouts[id])
      }
    }
  }, [ votes, voteTime ])
}

const Wrap = ({ children }) => (
  <Main assetsUrl={ASSETS_URL}>
    <Header primary="Dot Voting" />
    {children}
  </Main>
)

Wrap.propTypes = {
  children: PropTypes.node.isRequired,
}

const Empty = () => (
  <Wrap>
    <div
      css={`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: -1;
      `}
    >
      <EmptyStateCard
        title="You do not have any dot votes."
        text="After you create an allocation or issue curation, you can vote here."
        illustration={illustration}
      />
    </div>
  </Wrap>
)

const App = () => {
  useVoteCloseWatcher()

  const { api, appState = {} } = useAragonApi()

  const handleResolveLocalIdentity = useCallback(address => {
    return api.resolveAddressIdentity(address).toPromise()
  }, [api])

  const handleShowLocalIdentityModal = useCallback(address => {
    return api
      .requestAddressIdentityModification(address)
      .toPromise()
  }, [api])

  const { votes = [], voteTime = 0, pctBase = 0 } = appState

  // TODO: move this logic to script.js so it's available app-wide by default
  const decorateVote = useCallback(vote => {
    const endDate = new Date(vote.data.startDate + voteTime)
    return {
      ...vote,
      endDate,
      open: isBefore(new Date(), endDate),
      quorum: safeDiv(vote.data.minAcceptQuorum, pctBase),
      description: vote.data.metadata,
      totalSupport: getTotalSupport(vote.data),
      type: vote.data.type,
    }
  }, [ voteTime, pctBase ])

  if (!votes.length) return <Empty />

  return (
    <Wrap>
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}>

        <Decisions decorateVote={decorateVote} />
      </IdentityProvider>
    </Wrap>
  )
}

// eslint-disable-next-line react/display-name
export default App
