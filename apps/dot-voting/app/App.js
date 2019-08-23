import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { ASSETS_URL, EmptyStateCard, Header, Main } from '@aragon/ui'
import { useAragonApi } from '@aragon/api-react'
import { isBefore } from 'date-fns'
import { getQuorumProgress, getTotalSupport } from './utils/vote-utils'
import { safeDiv } from './utils/math-utils'
import { IdentityProvider } from '../../../shared/identity'
import Decisions from './Decisions'
import emptyStatePng from './assets/voting-empty-state.png'

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
        text="Use the Allocations app to get started."
        onActivate={() => <div />}
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

  const {
    votes = [],
    entries = [],
    voteTime = 0,
    minParticipationPct = 0,
    pctBase = 0,
  } = appState

  const getAddressLabel = useCallback(option => {
    const entry = entries.find(entry => entry.addr === option.label)
    return entry ? entry.data.name : option.label
  }, [entries])

  // TODO: move this logic to script.js so it's available app-wide by default
  const decorateVote = useCallback(vote => {
    const endDate = new Date(vote.data.startDate + voteTime)
    vote.data.options = vote.data.options.map(option => ({
      ...option,
      label: getAddressLabel(option)
    }))
    return {
      ...vote,
      endDate,
      open: isBefore(new Date(), endDate),
      quorum: safeDiv(vote.data.minAcceptQuorum, pctBase),
      quorumProgress: getQuorumProgress(vote.data),
      minParticipationPct,
      description: vote.data.metadata,
      totalSupport: getTotalSupport(vote.data),
      type: vote.data.type,
    }
  }, [ voteTime, getAddressLabel, pctBase, minParticipationPct ])

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
